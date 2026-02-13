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

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const FREE_MATERIA_NAMES = [
  "história do direito", 
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

// Categorias com imagens de fundo (sem Conceitos - agora está no Seu Progresso)
const categoriasAulas = [
  { id: "areas", title: "Áreas do Direito", subtitle: "27 áreas", icon: Scale, thumb: areasThumb },
  { id: "concursos", title: "Iniciando em Concursos", subtitle: "Preparação", icon: Target, thumb: concursosThumb },
  { id: "portugues", title: "Português Jurídico", subtitle: "Gramática", icon: BookOpen, thumb: portuguesThumb },
];

const categoriaOAB = { id: "oab", title: "OAB", subtitle: "1ª Fase", icon: Gavel, thumb: oabThumb };

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const categorias = isAdmin ? [...categoriasAulas, categoriaOAB] : categoriasAulas;

  // === PROGRESSO: buscar tópicos em andamento ===
  const { data: progressoConceitos } = useQuery({
    queryKey: ["progresso-conceitos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("conceitos_topicos_progresso")
        .select("*, conceitos_topicos(titulo, materia_id)")
        .eq("user_id", user.id)
        .eq("leitura_completa", false)
        .gt("progresso_porcentagem", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.conceitos_topicos?.titulo || "Tópico",
        progresso: item.progresso_porcentagem || 0,
        tipo: "conceitos" as const,
        topicoId: item.topico_id,
      }));
    },
    staleTime: 1000 * 60 * 2,
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
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const todosProgresso = [...(progressoConceitos || []), ...(progressoAulas || [])];

  // === CONCEITOS: buscar matérias ===
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

  const handleCategoryClick = (id: string) => {
    if (id === "oab") {
      navigate("/oab/trilhas-aprovacao");
      return;
    }
    if (id === "concursos") {
      navigate("/ferramentas/simulados");
      return;
    }
    setActiveCategory(activeCategory === id ? null : id);
  };

  const handleContinuar = (item: any) => {
    if (item.tipo === "conceitos") {
      navigate(`/conceitos/topico/${item.topicoId}`);
    } else if (item.tipo === "aula") {
      navigate(`/aula/${item.aulaId}`);
    }
  };

  return (
    <div className="relative py-4 pb-24 flex flex-col items-center">
      {/* Title - Jornada de Estudos */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4"
      >
        <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
          Jornada de Estudos
        </h2>
        <p className="text-amber-200/70 text-xs">Fundamentos do Direito</p>
      </motion.div>

      {/* Card Trilha de Conceitos */}
      <div className="w-full px-3 mb-4">
        <button
          onClick={() => navigate("/conceitos")}
          className="w-full group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.01] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[110px]"
        >
          <img 
            src={conceitosThumb} 
            alt="Trilha de Conceitos"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          <div className="relative z-10 p-4 h-full flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
              <Footprints className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Trilha de Conceitos</h3>
              <p className="text-white/50 text-[10px] mt-0.5">Iniciante • Fundamentos do Direito</p>
              {todosProgresso.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress 
                    value={todosProgresso[0].progresso} 
                    className="h-1.5 flex-1 max-w-[120px] bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" 
                  />
                  <span className="text-[10px] text-amber-400 font-medium">
                    {todosProgresso[0].progresso}%
                  </span>
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>

      {/* Grid de Categorias com Imagens */}
      <div className="w-full px-3 mb-6">
        <div className="grid grid-cols-2 gap-2.5">
          {categorias.map((categoria) => {
            const Icon = categoria.icon;
            const isActive = activeCategory === categoria.id;
            return (
              <button
                key={categoria.id}
                onClick={() => handleCategoryClick(categoria.id)}
                className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-150 hover:scale-[1.02] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[140px] ${
                  isActive ? 'ring-2 ring-amber-400/60 scale-[1.02]' : ''
                }`}
              >
                {/* Imagem de fundo */}
                <img 
                  src={categoria.thumb} 
                  alt={categoria.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
                
                {/* Conteúdo */}
                <div className="relative z-10 p-3 h-full flex flex-col justify-between">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1.5 w-fit group-hover:bg-white/30 transition-colors">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                      {categoria.title}
                    </h3>
                    <p className="text-white/50 text-[10px] mt-0.5">{categoria.subtitle}</p>
                  </div>
                </div>
                
                {/* Seta */}
                <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all z-10" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da categoria selecionada */}
      {activeCategory === "conceitos" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* Info Stats */}
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

              {/* Timeline de Matérias */}
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

      {activeCategory === "areas" && (
        <>
          {/* Chip Carousel - Áreas do Direito */}
          <div className="w-full mb-5">
            <div 
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {AREAS_ORDEM.map((area) => (
                <button
                  key={area.value}
                  onClick={() => setActiveArea(area.value)}
                  className={`flex-shrink-0 w-28 py-2 rounded-full text-xs font-medium transition-all text-center leading-tight ${
                    activeArea === area.value
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gray-700/80 text-white/70 hover:text-white/90'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>
          <MobileAreaTrilha area={activeArea} />
        </>
      )}

      {activeCategory === "portugues" && (
        <div className="text-center py-10 text-white/50 text-sm">
          Em breve: Português para Concurso
        </div>
      )}

      {/* Menu de rodapé fixo - apenas admin */}
      {isAdmin && activeCategory && <CategoriasBottomNav activeTab="aulas" />}
    </div>
  );
});

MobileTrilhasAprender.displayName = 'MobileTrilhasAprender';
