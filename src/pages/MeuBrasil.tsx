import { useNavigate } from "react-router-dom";
import { Clock, Globe, Users, Building2, FileText, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/PageHero";

const MeuBrasil = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const categorias = [
    {
      id: "historia",
      titulo: "História Jurídica",
      descricao: "Linha do tempo do direito no Brasil",
      icon: Clock,
      path: "/meu-brasil/historia",
    },
    {
      id: "sistemas",
      titulo: "Sistemas Jurídicos",
      descricao: "Compare Brasil com outros países",
      icon: Globe,
      path: "/meu-brasil/sistemas",
    },
    {
      id: "juristas",
      titulo: "Juristas Brasileiros",
      descricao: "Grandes nomes do direito",
      icon: Users,
      path: "/meu-brasil/juristas",
    },
    {
      id: "instituicoes",
      titulo: "Instituições",
      descricao: "Órgãos do sistema jurídico",
      icon: Building2,
      path: "/meu-brasil/instituicoes",
    },
    {
      id: "casos",
      titulo: "Casos Famosos",
      descricao: "Casos históricos marcantes",
      icon: FileText,
      path: "/meu-brasil/casos",
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/meu-brasil/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-green-950/20 to-neutral-950 pb-20">
      <PageHero
        title="🇧🇷 Meu Brasil"
        subtitle="Conheça o Brasil através da Wikipedia"
        icon={Globe}
        iconGradient="from-green-500/20 to-green-600/10"
        iconColor="text-green-400"
        lineColor="via-green-500"
        pageKey="meu-brasil"
        showGenerateButton={true}
      />

      <div className="px-3 max-w-4xl mx-auto">
        {/* Busca Global */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar em todas as categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur-sm border-white/10"
            />
          </div>
        </form>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-2 gap-3">
          {categorias.map((categoria) => {
            const Icon = categoria.icon;
            return (
              <button
                key={categoria.id}
                onClick={() => navigate(categoria.path)}
                className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-left transition-all hover:border-green-500/40 hover:bg-card/80 group"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="bg-green-500/20 rounded-lg p-3">
                    <Icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1 text-white group-hover:text-green-400 transition-colors">
                      {categoria.titulo}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {categoria.descricao}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informação sobre a fonte */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-neutral-500 text-center">
            📚 Conteúdo fornecido pela Wikipedia em português
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeuBrasil;
