import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Footprints, GraduationCap, Book, ArrowRight, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import themisBackground from "@/assets/themis-estudos-background.webp";

const ConceitosInicio = () => {
  const navigate = useNavigate();

  // Buscar trilhas do banco
  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["conceitos-trilhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_trilhas")
        .select("*")
        .eq("ativo", true)
        .order("codigo");
      
      if (error) {
        console.error("Erro ao buscar trilhas:", error);
        return [];
      }
      return data || [];
    },
  });

  // Buscar contagem de matérias e tópicos do Trilhante (Trilha 2)
  const { data: trilhanteStats } = useQuery({
    queryKey: ["conceitos-trilhante-stats"],
    queryFn: async () => {
      const { data: materias } = await supabase
        .from("conceitos_materias")
        .select("id")
        .eq("ativo", true);
      
      const materiaIds = materias?.map(m => m.id) || [];
      
      const { count: topicosCount } = await supabase
        .from("conceitos_topicos")
        .select("*", { count: "exact", head: true })
        .in("materia_id", materiaIds);
      
      return {
        materias: materias?.length || 0,
        topicos: topicosCount || 0
      };
    },
  });

  // Buscar contagem de temas do Livro (Trilha 1)
  const { data: livroStats } = useQuery({
    queryKey: ["conceitos-livro-stats"],
    queryFn: async () => {
      const { count: temasCount } = await supabase
        .from("conceitos_livro_temas")
        .select("*", { count: "exact", head: true })
        .eq("trilha", "conceitos_1");
      
      const { data: trilha } = await supabase
        .from("conceitos_trilhas")
        .select("total_paginas, total_temas, status")
        .eq("codigo", "conceitos_1")
        .single();
      
      return {
        temas: temasCount || trilha?.total_temas || 0,
        paginas: trilha?.total_paginas || 181,
        status: trilha?.status || "pendente"
      };
    },
  });

  const trilhaCards = [
    {
      id: "conceitos_1",
      numero: 1,
      titulo: "Introdução ao Estudo do Direito",
      descricao: "Aprenda os fundamentos jurídicos através de um livro completo",
      icon: Book,
      stats: `${livroStats?.paginas || 181} páginas • ${livroStats?.temas || 0} temas`,
      status: livroStats?.status || "pendente",
      route: "/conceitos/livro/conceitos_1",
      color: "from-amber-600 via-amber-700 to-amber-900",
      borderColor: "border-amber-500/50",
      shadowColor: "shadow-amber-900/30",
      available: true
    },
    {
      id: "conceitos_2",
      numero: 2,
      titulo: "Iniciando no Mundo do Direito",
      descricao: "Trilha completa baseada no Trilhante com 16 matérias",
      icon: GraduationCap,
      stats: `${trilhanteStats?.materias || 16} matérias • ${trilhanteStats?.topicos || 151} tópicos`,
      status: "pronto",
      route: "/conceitos/trilhante",
      color: "from-red-700 via-red-800 to-red-900",
      borderColor: "border-red-600/50",
      shadowColor: "shadow-red-900/30",
      available: true
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${themisBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/primeiros-passos')}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Trilhas de Conceitos</h1>
              <p className="text-xs text-white/70">Escolha sua jornada de estudos</p>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="px-4 py-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Footprints className="w-6 h-6 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Duas Trilhas Disponíveis</h2>
            </div>
            <p className="text-sm text-white/70">
              Escolha entre o estudo aprofundado através do livro ou a trilha estruturada do Trilhante
            </p>
          </div>
        </div>

        {/* Cards das Trilhas */}
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto space-y-6">
            {trilhaCards.map((trilha, index) => {
              const IconComponent = trilha.icon;
              
              return (
                <motion.div
                  key={trilha.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <button
                    onClick={() => trilha.available && navigate(trilha.route)}
                    disabled={!trilha.available}
                    className="w-full text-left"
                  >
                    <div 
                      className={`relative p-6 rounded-2xl border bg-gradient-to-br ${trilha.color} ${trilha.borderColor} shadow-xl ${trilha.shadowColor} transition-all duration-300 hover:scale-[1.02] overflow-hidden`}
                    >
                      {/* Decoração de fundo */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <IconComponent className="w-full h-full" />
                      </div>
                      
                      {/* Número da Trilha */}
                      <div className="absolute top-4 right-4">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{trilha.numero}</span>
                        </div>
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{trilha.titulo}</h3>
                          </div>
                        </div>
                        
                        <p className="text-sm text-white/80 mb-4">
                          {trilha.descricao}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-300 font-medium">{trilha.stats}</span>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        {trilha.status !== "pronto" && (
                          <div className="mb-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              trilha.status === "pendente" 
                                ? "bg-yellow-500/20 text-yellow-300"
                                : trilha.status === "extraindo" || trilha.status === "analisando"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-green-500/20 text-green-300"
                            }`}>
                              {trilha.status === "pendente" && "⏳ Processamento pendente"}
                              {trilha.status === "extraindo" && "📖 Extraindo conteúdo..."}
                              {trilha.status === "analisando" && "🔍 Analisando estrutura..."}
                              {trilha.status === "pronto" && "✅ Pronto"}
                            </span>
                          </div>
                        )}
                        
                        {/* Botão Acessar */}
                        <div className="flex justify-center">
                          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 rounded-full text-white font-medium">
                            <Footprints className="w-4 h-4" />
                            <span>Acessar</span>
                            <motion.div
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceitosInicio;
