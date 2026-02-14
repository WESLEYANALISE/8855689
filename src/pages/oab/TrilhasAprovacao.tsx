import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Loader2, Scale, Search, X } from "lucide-react";
import { FileText, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";

// Cache keys for localStorage
const CACHE_KEYS = {
  materias: 'oab-trilhas-materias-cache',
  topicosCount: 'oab-trilhas-topicos-count-cache',
};

const getCachedData = <T,>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch (e) { console.warn('Cache read error:', e); }
  return null;
};

const setCachedData = <T,>(key: string, data: T): void => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn('Cache write error:', e); }
};

const preloadImages = (urls: string[]) => {
  urls.forEach(url => { if (url) { const img = new Image(); img.src = getOptimizedImageUrl(url, 'card-lg'); } });
};

export default function TrilhasAprovacao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { data: materias, isLoading } = useQuery({
    queryKey: ["oab-trilhas-materias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_materias")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      if (data) setCachedData(CACHE_KEYS.materias, data);
      return data || [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: (getCachedData<any[]>(CACHE_KEYS.materias) || []) as any,
  });

  const { data: topicosCount } = useQuery({
    queryKey: ["oab-trilhas-topicos-count"],
    queryFn: async () => {
      const aulaCounts: Record<number, number> = {};
      let totalAulas = 0;
      
      const { data: topicos } = await supabase.from("oab_trilhas_topicos").select("materia_id");
      if (topicos) {
        topicos.forEach(t => { aulaCounts[t.materia_id] = (aulaCounts[t.materia_id] || 0) + 1; });
        totalAulas = topicos.length;
      }
      
      const { data: eticaTopicos } = await supabase.from("oab_etica_topicos").select("tema_id");
      const { data: eticaMateria } = await supabase.from("oab_trilhas_materias").select("id").ilike("nome", "%ética%").maybeSingle();
      if (eticaTopicos && eticaMateria) {
        aulaCounts[eticaMateria.id] = (aulaCounts[eticaMateria.id] || 0) + eticaTopicos.length;
        totalAulas += eticaTopicos.length;
      }
      
      const totalMaterias = Object.keys(aulaCounts).length;
      const result = { aulaCounts, totalAulas, totalMaterias };
      setCachedData(CACHE_KEYS.topicosCount, result);
      return result;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: getCachedData<{ aulaCounts: Record<number, number>; totalAulas: number; totalMaterias: number }>(CACHE_KEYS.topicosCount) || { aulaCounts: {}, totalAulas: 0, totalMaterias: 0 },
  });

  const handleNavigate = useCallback((materia: { id: number; nome: string }) => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    if (materia.nome.toLowerCase().includes("ética")) {
      navigate('/oab/trilhas-etica');
    } else {
      navigate(`/oab/trilhas-aprovacao/materia/${materia.id}`);
    }
  }, [isPremium, navigate]);

  const totalAreas = materias?.length || 0;
  const totalMateriasCount = topicosCount?.totalMaterias || 0;
  const totalAulas = topicosCount?.totalAulas || 0;
  const hasData = totalAreas > 0 || getCachedData(CACHE_KEYS.materias);

  const filteredMaterias = useMemo(() => {
    if (!materias) return [];
    if (!searchTerm.trim()) return materias;
    const term = searchTerm.toLowerCase().trim();
    return materias.filter(m => m.nome.toLowerCase().includes(term));
  }, [materias, searchTerm]);

  useEffect(() => {
    if (materias && materias.length > 0) {
      const capaUrls = materias.map(m => m.capa_url).filter(Boolean) as string[];
      if (capaUrls.length > 0) preloadImages(capaUrls);
      materias.forEach(materia => {
        queryClient.prefetchQuery({
          queryKey: ["oab-trilha-materias-da-area", materia.id],
          queryFn: async () => {
            const { data, error } = await supabase.from("oab_trilhas_topicos").select("*").eq("materia_id", materia.id).order("ordem");
            if (error) throw error;
            return data;
          },
          staleTime: Infinity,
        });
      });
    }
  }, [materias, queryClient]);

  if (isLoading && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0">
        <img src={bgAreasOab} alt="Background Trilhas" className="w-full h-full object-cover object-center" loading="eager" fetchPriority="high" decoding="sync" />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate('/oab/primeira-fase')} className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Trilhas da Aprovação
                </h1>
                <p className="text-sm text-gray-400">OAB 1ª Fase</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalAreas} áreas</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              <span>{totalMateriasCount} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{totalAulas} aulas</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar área do direito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {filteredMaterias.length} área{filteredMaterias.length !== 1 ? 's' : ''} encontrada{filteredMaterias.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Serpentine */}
        {filteredMaterias.length > 0 ? (
          <SerpentineNiveis
            items={filteredMaterias}
            getItemCapa={(item) => item.capa_url}
            getItemTitulo={(item) => item.nome}
            getItemOrdem={(item) => item.ordem || 0}
            getItemAulas={(item) => topicosCount?.aulaCounts?.[item.id] || 0}
            getItemProgresso={() => 0}
            onItemClick={(item) => handleNavigate(item)}
          />
        ) : (
          <div className="text-center py-10 text-white/50 text-sm">Nenhuma área encontrada.</div>
        )}

        <PremiumUpgradeModal open={showPremiumModal} onOpenChange={setShowPremiumModal} featureName="Todas as áreas" />
      </div>
    </div>
  );
}
