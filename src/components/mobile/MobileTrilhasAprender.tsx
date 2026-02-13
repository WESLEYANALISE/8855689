import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Footprints, Scale, BookOpen, Gavel, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const categoriasAulas = [
  { id: "iniciante", title: "Iniciante", icon: Footprints, route: "/conceitos/trilhas", color: "from-amber-500 to-amber-700" },
  { id: "areas", title: "Áreas do Direito", icon: Scale, route: "/conceitos/trilhas", color: "from-red-500 to-red-700" },
  { id: "portugues", title: "Português p/ Concurso", icon: BookOpen, route: "/conceitos/trilhas", color: "from-sky-500 to-sky-700" },
];

const categoriaOAB = { id: "oab", title: "OAB", icon: Gavel, route: "/oab/trilhas-aprovacao", color: "from-emerald-500 to-emerald-700" };

export const MobileTrilhasAprender = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const categorias = isAdmin ? [...categoriasAulas, categoriaOAB] : categoriasAulas;

  return (
    <div className="relative min-h-[300px] pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500/20 rounded-xl">
          <BookOpen className="w-5 h-5 text-red-100" />
        </div>
        <div>
          <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
            Jornada de Estudos
          </h3>
          <p className="text-white/70 text-xs">Fundamentos do Direito</p>
        </div>
      </div>

      {/* Grid de Categorias - Mesmo estilo do Vade Mecum */}
      <div className="grid grid-cols-2 gap-3">
        {categorias.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.route)}
              className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${categoria.color} shadow-lg h-[100px]`}
            >
              {/* Ícone de fundo decorativo */}
              <div className="absolute -right-3 -bottom-3 opacity-20">
                <Icon className="w-20 h-20 text-white" />
              </div>
              
              {/* Ícone principal */}
              <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Título */}
              <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                {categoria.title}
              </h3>
              
              {/* Seta */}
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

MobileTrilhasAprender.displayName = 'MobileTrilhasAprender';
