import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Landmark, Users, Gavel, BookText, HandCoins, FileText, Scroll, ChevronRight, BookOpen, Search, Newspaper } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

// Categorias do Vade Mecum com cores vibrantes (ordem exata do Vade Mecum)
const categoriasVadeMecum = [
  { id: "constituicao", title: "Constituição", icon: Landmark, route: "/constituicao", color: "from-amber-500 to-amber-700", free: true },
  { id: "codigos", title: "Códigos", icon: Scale, route: "/codigos", color: "from-red-500 to-red-700", free: false },
  { id: "legislacao-penal", title: "Legislação Penal", icon: Gavel, route: "/legislacao-penal-especial", color: "from-orange-500 to-orange-700", free: false },
  { id: "estatutos", title: "Estatutos", icon: Users, route: "/estatutos", color: "from-sky-500 to-sky-700", free: false },
  { id: "previdenciario", title: "Previdenciário", icon: HandCoins, route: "/previdenciario", color: "from-emerald-500 to-emerald-700", free: false },
  { id: "sumulas", title: "Súmulas", icon: BookText, route: "/sumulas", color: "from-slate-500 to-slate-700", free: false },
  { id: "leis-ordinarias", title: "Leis Ordinárias", icon: FileText, route: "/leis-ordinarias", color: "from-cyan-500 to-cyan-700", free: false },
];

const quickActions = [
  { id: "explicacao", label: "Explicação", icon: BookOpen, route: "/leis/explicacoes" },
  { id: "procurar", label: "Procurar", icon: Search, route: "/vade-mecum/busca" },
  { id: "resenha", label: "Resenha", icon: Newspaper, route: "/vade-mecum/resenha-diaria" },
];

export const MobileLeisHome = memo(() => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="relative min-h-[500px] pb-32">
      {/* Ações rápidas */}
      <div className="flex gap-2 mb-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="flex-1 relative overflow-hidden flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border/50 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:bg-accent/50 transition-all"
            >
              {/* Ícone decorativo de fundo */}
              <div className="absolute -right-2 -bottom-2 opacity-10">
                <Icon className="w-12 h-12 text-red-400" />
              </div>
              <Icon className="w-5 h-5 text-red-400" />
              <span className="text-[11px] font-medium text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Scale className="w-5 h-5 text-amber-100" />
        </div>
        <div>
          <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight flex items-center gap-2">
            Vade Mecum <span className="w-px h-4 bg-amber-100/50" /> <span className="font-normal">Comentado</span>
          </h3>
          <p className="text-white/70 text-xs">Legislação 2026</p>
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 gap-3">
        {categoriasVadeMecum.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.route)}
              className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${categoria.color} shadow-lg h-[100px]`}
            >
              <div className="absolute -right-3 -bottom-3 opacity-20">
                <Icon className="w-20 h-20 text-white" />
              </div>
              {!categoria.free && !isPremium && !loadingSubscription && (
                <PremiumBadge position="top-right" size="sm" />
              )}
              <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                {categoria.title}
              </h3>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

MobileLeisHome.displayName = 'MobileLeisHome';

export default MobileLeisHome;
