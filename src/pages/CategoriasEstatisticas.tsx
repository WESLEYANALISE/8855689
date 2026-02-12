import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CategoriasBottomNav } from "@/components/categorias/CategoriasBottomNav";
import { TrendingUp } from "lucide-react";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const CategoriasEstatisticas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-24">
      <div className="pt-6 pb-4 px-4 text-center">
        <TrendingUp className="w-12 h-12 text-red-500/50 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white">Estatísticas</h1>
        <p className="text-sm text-gray-400 mt-1">Áreas de maior interesse e tempo de estudo</p>
      </div>
      <div className="px-4 py-8 text-center">
        <p className="text-gray-500">Em breve - Descubra seus padrões de estudo</p>
      </div>
      <CategoriasBottomNav activeTab="estatisticas" />
    </div>
  );
};

export default CategoriasEstatisticas;
