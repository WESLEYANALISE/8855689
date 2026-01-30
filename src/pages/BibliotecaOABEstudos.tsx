import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, BookOpen, ChevronRight, Book, Gavel } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import capaOabEstudos from "@/assets/capa-biblioteca-oab-estudos.jpg";
import { StandardPageHeader } from "@/components/StandardPageHeader";

interface BibliotecaItem {
  id: number;
  Área: string | null;
  Ordem: number | null;
  Tema: string | null;
  Download: string | null;
  Link: string | null;
  "Capa-area": string | null;
  "Capa-livro": string | null;
  Sobre: string | null;
}

// Cores para as áreas
const areaColors: Record<string, string> = {
  "Direito Administrativo": "#3b82f6",
  "Direito Ambiental": "#10b981",
  "Direito Civil": "#f59e0b",
  "Direito Constitucional": "#ef4444",
  "Direito do Consumidor": "#8b5cf6",
  "Direito do Trabalho": "#ec4899",
  "Direito Empresarial": "#0891b2",
  "Direito Penal": "#dc2626",
  "Direito Processual Civil": "#6366f1",
  "Direito Processual Penal": "#7c3aed",
  "Direito Tributário": "#059669",
  "Direitos Humanos": "#2563eb",
  "Ética Profissional": "#9333ea",
  "Filosofia do Direito": "#d97706",
  "Estatuto da Criança e do Adolescente": "#14b8a6",
  "Direito Internacional": "#0ea5e9",
};

const getAreaColor = (area: string): string => {
  return areaColors[area] || "#6366f1";
};

const BibliotecaOABEstudos = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Hero image cache check
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = capaOabEstudos;
    return img.complete;
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-oab-estudos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBILIOTECA-OAB")
        .select("*")
        .order("Ordem", { ascending: true });
      if (error) throw error;
      return data as BibliotecaItem[];
    },
    staleTime: 1000 * 60 * 60,
  });

  // Agrupar por área
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = { capa: item["Capa-area"], livros: [] };
      }
      acc[area].livros.push(item);
      return acc;
    }, {} as Record<string, { capa: string | null; livros: BibliotecaItem[] }>);
  }, [items]);

  // Filtrar áreas
  const areasFiltradas = useMemo(() => {
    if (!areaGroups) return [];
    const searchLower = debouncedSearch.toLowerCase();
    
    return Object.entries(areaGroups)
      .map(([area, data]) => {
        const livrosFiltrados = data.livros.filter(livro =>
          (livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        const incluirArea = area.toLowerCase().includes(searchLower) || livrosFiltrados.length > 0;
        return incluirArea ? [area, { ...data, livros: debouncedSearch ? livrosFiltrados : data.livros }] as const : null;
      })
      .filter((item): item is [string, typeof areaGroups[string]] => item !== null)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [areaGroups, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Área selecionada - mostrar livros
  if (selectedArea && areaGroups) {
    const areaData = areaGroups[selectedArea];
    const livrosFiltrados = areaData.livros.filter(livro => 
      (livro.Tema || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setSelectedArea(null); setSearchTerm(""); }} className="mb-4">
            ← Voltar às Áreas
          </Button>
          <h1 className="text-xl md:text-2xl font-bold mb-1">{selectedArea}</h1>
          <p className="text-sm text-muted-foreground">
            {areaData.livros.length} {areaData.livros.length === 1 ? "livro disponível" : "livros disponíveis"}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar livro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {livrosFiltrados.map((livro, idx) => (
            <LivroCard 
              key={idx} 
              titulo={livro.Tema || "Sem título"} 
              subtitulo={selectedArea} 
              capaUrl={livro["Capa-livro"]} 
              sobre={livro.Sobre} 
              onClick={() => navigate(`/biblioteca-oab/${livro.id}`)} 
            />
          ))}
        </div>
      </div>
    );
  }

  // Tela principal - timeline de áreas
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Fixed */}
      <div className="fixed inset-0">
        <img
          src={capaOabEstudos}
          alt="Estudos OAB"
          className={`w-full h-full object-cover object-[50%_30%] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-neutral-900" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header padrão fixo */}
        <StandardPageHeader title="OAB" position="fixed" backPath="/biblioteca-oab" />
        
        {/* Hero section */}
        <div className="pt-14 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  <span className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 bg-clip-text text-transparent">
                    Estudos OAB
                  </span>
                </h1>
                <p className="text-sm text-gray-400">
                  Materiais completos por área
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <Card className="bg-black/40 backdrop-blur-sm border-white/10">
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Buscar área ou livro..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                  />
                  <Button variant="outline" size="icon" className="shrink-0 border-white/20 text-white hover:bg-white/10">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline de Áreas */}
        <div className="px-4 pb-24 pt-2">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-blue-500/80 via-blue-600/60 to-blue-700/40 rounded-full" />
              {/* Animação de fluxo contínuo */}
              <motion.div
                className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/60 via-blue-300/50 to-transparent rounded-full"
                animate={{ y: ["-100%", "500%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="space-y-5">
              {areasFiltradas.length > 0 ? (
                areasFiltradas.map(([area, data], index) => {
                  const isLeft = index % 2 === 0;
                  const color = getAreaColor(area);
                  const capaUrl = data.capa;
                  
                  return (
                    <motion.div
                      key={area}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      {/* Marcador Martelo no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                            boxShadow: `0 4px 15px ${color}50`
                          }}
                        >
                          <Gavel className="w-4 h-4 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card da Área - Formato Livro */}
                      <div className="w-full">
                        <motion.button
                          onClick={() => setSelectedArea(area)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full rounded-2xl overflow-hidden text-left"
                          style={{
                            boxShadow: `0 4px 20px ${color}30`
                          }}
                        >
                          {/* Capa estilo livro - aspect ratio 3:4 */}
                          <div className="aspect-[3/4] w-full overflow-hidden relative group">
                            {capaUrl ? (
                              <img 
                                src={capaUrl} 
                                alt={area}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${color}60, ${color}30)` }}
                              >
                                <BookOpen className="w-12 h-12" style={{ color }} />
                              </div>
                            )}
                            
                            {/* Badge de contagem - topo esquerdo */}
                            <div 
                              className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm"
                              style={{ backgroundColor: `${color}90` }}
                            >
                              <Book className="w-3 h-3 text-white" />
                              <span className="text-xs font-bold text-white">
                                {data.livros.length}
                              </span>
                              <span className="text-[10px] text-white/80">livros</span>
                            </div>
                            
                            {/* Gradiente apenas na parte inferior para texto */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                            
                            {/* Conteúdo sobre a capa */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              {/* Título */}
                              <h3 className="font-bold text-base text-white mb-2 line-clamp-2">
                                {area}
                              </h3>
                              
                              {/* Botão Acessar abaixo, alinhado à direita */}
                              <div className="flex justify-end">
                                <div 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-medium backdrop-blur-sm"
                                  style={{ backgroundColor: `${color}cc` }}
                                >
                                  <span>Acessar</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibliotecaOABEstudos;
