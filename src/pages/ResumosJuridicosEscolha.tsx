import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Search, BookOpen, Scale, PenTool, Scroll, 
  Crown, Shield, Gavel, HandCoins, BookText, FileText, FileUp, Image,
  BookMarked, Loader2, Footprints, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import themisImage from "@/assets/themis-advogada-vertical.webp";

// Preload da imagem
const preloadedImage = new window.Image();
preloadedImage.src = themisImage;

// ABA 2: ARTIGOS DE LEI (estático)
const categoriasArtigos = [
  {
    id: "constituicao",
    title: "Constituição",
    description: "CF/88 - Lei Fundamental",
    icon: Crown,
    route: "/resumos-juridicos/artigos-lei/temas?codigo=CF - Constituição Federal"
  },
  {
    id: "codigos",
    title: "Códigos e Leis",
    description: "CP, CC, CPC, CPP, CLT, CDC, CTN",
    icon: Scale,
    route: "/resumos-juridicos/artigos-lei/codigos"
  },
  {
    id: "legislacao-penal",
    title: "Legislação Penal",
    description: "Leis Penais Especiais",
    icon: Shield,
    route: "/resumos-juridicos/artigos-lei/legislacao-penal"
  },
  {
    id: "estatutos",
    title: "Estatutos",
    description: "ECA, OAB, Idoso, Cidade",
    icon: Gavel,
    route: "/resumos-juridicos/artigos-lei/estatutos"
  },
  {
    id: "previdenciario",
    title: "Previdenciário",
    description: "Custeio e Benefícios",
    icon: HandCoins,
    route: "/resumos-juridicos/artigos-lei/previdenciario"
  },
  {
    id: "sumulas",
    title: "Súmulas",
    description: "STF, STJ, TST, TSE",
    icon: BookText,
    route: "/resumos-juridicos/artigos-lei/sumulas"
  }
];

// ABA 3: PERSONALIZADO (estático)
const categoriasPersonalizado = [
  {
    id: "texto",
    title: "Colar Texto",
    description: "Digite ou cole texto jurídico",
    icon: FileText,
    route: "/resumos-juridicos/personalizado?tipo=texto"
  },
  {
    id: "pdf",
    title: "Upload PDF",
    description: "Envie arquivos PDF",
    icon: FileUp,
    route: "/resumos-juridicos/personalizado?tipo=pdf"
  },
  {
    id: "imagem",
    title: "Foto/Imagem",
    description: "Envie fotos de documentos",
    icon: Image,
    route: "/resumos-juridicos/personalizado?tipo=imagem"
  }
];

export default function ResumosJuridicosEscolha() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("materia");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar áreas distintas da tabela RESUMO
  const { data: areasData, isLoading } = useQuery({
    queryKey: ['resumos-juridicos-areas'],
    queryFn: async () => {
      let allData: { area: string }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('RESUMO')
          .select('area')
          .not('area', 'is', null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Agrupar e contar por área
      const contagemPorArea: Record<string, number> = {};
      allData.forEach((item) => {
        if (item.area) {
          contagemPorArea[item.area] = (contagemPorArea[item.area] || 0) + 1;
        }
      });

      // Converter para array ordenado alfabeticamente
      return Object.entries(contagemPorArea)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area));
    }
  });

  // Total de resumos
  const totalResumos = useMemo(() => {
    if (!areasData) return 0;
    return areasData.reduce((acc, item) => acc + item.count, 0);
  }, [areasData]);

  // Filtrar por busca
  const areasFiltradas = useMemo(() => {
    if (!areasData) return [];
    if (!searchTerm.trim()) return areasData;
    
    const termo = searchTerm.toLowerCase();
    return areasData.filter(a => a.area.toLowerCase().includes(termo));
  }, [areasData, searchTerm]);

  // Adicionar lado (esquerda/direita) para cada área
  const areasComLado = useMemo(() => {
    return areasFiltradas.map((item, index) => ({
      ...item,
      lado: index % 2 === 0 ? 'left' : 'right'
    }));
  }, [areasFiltradas]);

  // Artigos com lado
  const artigosComLado = useMemo(() => {
    const filtered = categoriasArtigos.filter(a => 
      a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.map((item, index) => ({
      ...item,
      lado: index % 2 === 0 ? 'left' : 'right'
    }));
  }, [searchTerm]);

  // Custom com lado
  const customComLado = useMemo(() => {
    const filtered = categoriasPersonalizado.filter(a => 
      a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.map((item, index) => ({
      ...item,
      lado: index % 2 === 0 ? 'left' : 'right'
    }));
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={themisImage}
          alt="Resumos Jurídicos"
          className="w-full h-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.6) 0%,
              hsl(var(--background) / 0.85) 30%,
              hsl(var(--background) / 0.95) 50%,
              hsl(var(--background)) 70%
            )`
          }}
        />
      </div>

      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/98 to-transparent backdrop-blur-md">
        <div className="px-4 py-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-xl bg-red-700/15 hover:bg-red-700/25 transition-all duration-300 border border-red-700/40"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10">
                <Scroll className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Resumos Jurídicos</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Conhecimento para trilhar seu caminho
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full mb-4">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="materia" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              >
                <BookMarked className="w-4 h-4" />
                <span>Matéria</span>
              </TabsTrigger>
              <TabsTrigger 
                value="artigos" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <Scale className="w-4 h-4" />
                <span>Artigos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="personalizado" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Custom</span>
                <span className="sm:hidden">Custom</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-card/50 border-red-700/30 focus:border-red-600/50 rounded-xl h-11"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo com Timeline */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {/* ABA MATÉRIA */}
            {abaAtiva === "materia" && (
              <div className="relative py-10 px-4">
                {/* Linha vertical central */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-700/50 via-red-700/30 to-transparent" />
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-600 via-red-600/70 to-transparent rounded-full"
                    animate={{ y: ["0%", "300%", "0%"] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ filter: "blur(2px)" }}
                  />
                </div>

                {/* Cards das áreas */}
                <div className="space-y-6">
                  {areasComLado.map((item, index) => {
                    const isLeft = item.lado === 'left';
                    
                    return (
                      <motion.div
                        key={item.area}
                        className="relative flex items-center"
                        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        {/* Card esquerdo */}
                        <div className={`w-[44%] h-[140px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                          {isLeft && (
                            <motion.div
                              onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(item.area)}`)}
                              whileHover={{ scale: 1.03, x: -4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 shadow-lg shadow-red-900/30 transition-all duration-300 border border-red-600/40 hover:shadow-xl hover:shadow-red-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.area}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.count} resumos
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* Marcador central - Pegadas */}
                        <div className="w-[12%] shrink-0 flex items-center justify-center">
                          <motion.div 
                            className="p-1.5 rounded-full bg-red-700/25 border border-red-600/50"
                            whileHover={{ scale: 1.2 }}
                            animate={{ 
                              boxShadow: ["0 0 0 0 rgba(220, 38, 38, 0.3)", "0 0 0 6px rgba(220, 38, 38, 0)", "0 0 0 0 rgba(220, 38, 38, 0.3)"]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                          >
                            <Footprints className="w-4 h-4 text-red-500" />
                          </motion.div>
                        </div>

                        {/* Card direito */}
                        <div className={`w-[44%] h-[140px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                          {!isLeft && (
                            <motion.div
                              onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(item.area)}`)}
                              whileHover={{ scale: 1.03, x: 4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-bl from-red-700 via-red-800 to-red-900 shadow-lg shadow-red-900/30 transition-all duration-300 border border-red-600/40 hover:shadow-xl hover:shadow-red-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.area}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.count} resumos
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {areasComLado.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Nenhuma matéria encontrada para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}

            {/* ABA ARTIGOS */}
            {abaAtiva === "artigos" && (
              <div className="relative py-10 px-4">
                {/* Linha vertical central - Âmbar */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-600/50 via-amber-600/30 to-transparent" />
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500 via-amber-500/70 to-transparent rounded-full"
                    animate={{ y: ["0%", "300%", "0%"] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ filter: "blur(2px)" }}
                  />
                </div>

                <div className="space-y-6">
                  {artigosComLado.map((item, index) => {
                    const isLeft = item.lado === 'left';
                    const Icon = item.icon;
                    
                    return (
                      <motion.div
                        key={item.id}
                        className="relative flex items-center"
                        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        {/* Card esquerdo */}
                        <div className={`w-[44%] h-[140px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                          {isLeft && (
                            <motion.div
                              onClick={() => navigate(item.route)}
                              whileHover={{ scale: 1.03, x: -4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-lg shadow-amber-900/30 transition-all duration-300 border border-amber-500/40 hover:shadow-xl hover:shadow-amber-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.description}
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* Marcador central - Pegadas */}
                        <div className="w-[12%] shrink-0 flex items-center justify-center">
                          <motion.div 
                            className="p-1.5 rounded-full bg-amber-600/25 border border-amber-500/50"
                            whileHover={{ scale: 1.2 }}
                            animate={{ 
                              boxShadow: ["0 0 0 0 rgba(217, 119, 6, 0.3)", "0 0 0 6px rgba(217, 119, 6, 0)", "0 0 0 0 rgba(217, 119, 6, 0.3)"]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                          >
                            <Footprints className="w-4 h-4 text-amber-500" />
                          </motion.div>
                        </div>

                        {/* Card direito */}
                        <div className={`w-[44%] h-[140px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                          {!isLeft && (
                            <motion.div
                              onClick={() => navigate(item.route)}
                              whileHover={{ scale: 1.03, x: 4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-bl from-amber-600 via-amber-700 to-amber-800 shadow-lg shadow-amber-900/30 transition-all duration-300 border border-amber-500/40 hover:shadow-xl hover:shadow-amber-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.description}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {artigosComLado.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Nenhuma categoria encontrada para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}

            {/* ABA CUSTOM */}
            {abaAtiva === "personalizado" && (
              <div className="relative py-10 px-4">
                {/* Linha vertical central - Roxo */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/50 via-purple-600/30 to-transparent" />
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500 via-purple-500/70 to-transparent rounded-full"
                    animate={{ y: ["0%", "300%", "0%"] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ filter: "blur(2px)" }}
                  />
                </div>

                <div className="space-y-6">
                  {customComLado.map((item, index) => {
                    const isLeft = item.lado === 'left';
                    const Icon = item.icon;
                    
                    return (
                      <motion.div
                        key={item.id}
                        className="relative flex items-center"
                        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        {/* Card esquerdo */}
                        <div className={`w-[44%] h-[140px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                          {isLeft && (
                            <motion.div
                              onClick={() => navigate(item.route)}
                              whileHover={{ scale: 1.03, x: -4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 shadow-lg shadow-purple-900/30 transition-all duration-300 border border-purple-500/40 hover:shadow-xl hover:shadow-purple-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.description}
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* Marcador central - Pegadas */}
                        <div className="w-[12%] shrink-0 flex items-center justify-center">
                          <motion.div 
                            className="p-1.5 rounded-full bg-purple-600/25 border border-purple-500/50"
                            whileHover={{ scale: 1.2 }}
                            animate={{ 
                              boxShadow: ["0 0 0 0 rgba(147, 51, 234, 0.3)", "0 0 0 6px rgba(147, 51, 234, 0)", "0 0 0 0 rgba(147, 51, 234, 0.3)"]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                          >
                            <Footprints className="w-4 h-4 text-purple-500" />
                          </motion.div>
                        </div>

                        {/* Card direito */}
                        <div className={`w-[44%] h-[140px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                          {!isLeft && (
                            <motion.div
                              onClick={() => navigate(item.route)}
                              whileHover={{ scale: 1.03, x: 4 }}
                              whileTap={{ scale: 0.97 }}
                              className="cursor-pointer rounded-2xl bg-gradient-to-bl from-purple-600 via-purple-700 to-purple-800 shadow-lg shadow-purple-900/30 transition-all duration-300 border border-purple-500/40 hover:shadow-xl hover:shadow-purple-600/25 p-4 h-full flex flex-col items-center justify-center text-center"
                            >
                              <div className="p-3 rounded-xl bg-white/15 mb-3 shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs text-white/70 mt-1">
                                {item.description}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {customComLado.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Nenhuma opção encontrada para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Total Counter */}
      <div className="fixed bottom-4 left-4 right-4 z-20">
        <div className="py-3 bg-card/90 backdrop-blur-md rounded-2xl border border-border/50 shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-5 h-5 text-red-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{totalResumos.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-muted-foreground">resumos disponíveis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
