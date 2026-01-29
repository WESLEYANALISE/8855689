import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Scale, Users, Briefcase, GraduationCap, ArrowRight, Mic, Book, Info } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ItemEmAlta {
  id: number;
  nome: string;
  imagem?: string;
  total_acessos: number;
}

interface BibliotecaConfig {
  tabela: string;
  tabelaOrigem: string;
  titulo: string;
  description: string;
  icon: React.ElementType;
  color: string;
  route: string;
  routeLivro: string;
  campoNome: string;
  campoImagem: string;
  mostrarArea?: boolean;
  key: string;
}

const bibliotecasConfig: BibliotecaConfig[] = [
  {
    tabela: "BIBLIOTECA-ESTUDOS",
    tabelaOrigem: "BIBLIOTECA-ESTUDOS",
    titulo: "Estudos",
    description: "Materiais de estudo organizados por área do Direito. Ideal para estudantes de graduação, concursos e OAB.",
    icon: GraduationCap,
    color: "#10b981",
    route: "/biblioteca-estudos",
    routeLivro: "/biblioteca-estudos",
    campoNome: "Área",
    campoImagem: "Capa-area",
    mostrarArea: true,
    key: "estudos",
  },
  {
    tabela: "BIBLIOTECA-CLASSICOS",
    tabelaOrigem: "BIBLIOTECA-CLASSICOS",
    titulo: "Clássicos",
    description: "Clássicos da literatura jurídica para enriquecer seus conhecimentos. Obras atemporais de grandes pensadores do Direito.",
    icon: Book,
    color: "#f59e0b",
    route: "/biblioteca-classicos",
    routeLivro: "/biblioteca-classicos",
    campoNome: "livro",
    campoImagem: "imagem",
    key: "classicos",
  },
  {
    tabela: "BIBILIOTECA-OAB",
    tabelaOrigem: "BIBILIOTECA-OAB",
    titulo: "OAB",
    description: "Biblioteca oficial com materiais essenciais para o Exame da Ordem. Prepare-se com os melhores conteúdos.",
    icon: Scale,
    color: "#3b82f6",
    route: "/biblioteca-oab",
    routeLivro: "/biblioteca-oab",
    campoNome: "Área",
    campoImagem: "Capa-area",
    mostrarArea: true,
    key: "oab",
  },
  {
    tabela: "BIBLIOTECA-ORATORIA",
    tabelaOrigem: "BIBLIOTECA-ORATORIA",
    titulo: "Oratória",
    description: "Domine a arte da comunicação e persuasão jurídica. Aprenda técnicas para se destacar em audiências e sustentações.",
    icon: Mic,
    color: "#8b5cf6",
    route: "/biblioteca-oratoria",
    routeLivro: "/biblioteca-oratoria/livro",
    campoNome: "livro",
    campoImagem: "imagem",
    key: "oratoria",
  },
  {
    tabela: "BIBLIOTECA-LIDERANÇA",
    tabelaOrigem: "BIBLIOTECA-LIDERANÇA",
    titulo: "Liderança",
    description: "Desenvolva habilidades de liderança e gestão para sua carreira. Essencial para advogados que gerenciam equipes e escritórios.",
    icon: Users,
    color: "#6366f1",
    route: "/biblioteca-lideranca",
    routeLivro: "/biblioteca-lideranca/livro",
    campoNome: "livro",
    campoImagem: "imagem",
    key: "lideranca",
  },
  {
    tabela: "BIBLIOTECA-FORA-DA-TOGA",
    tabelaOrigem: "BIBLIOTECA-FORA-DA-TOGA",
    titulo: "Fora da Toga",
    description: "Leituras complementares para ampliar sua visão além do Direito. Filosofia, história, literatura e muito mais.",
    icon: Briefcase,
    color: "#ec4899",
    route: "/biblioteca-fora-da-toga",
    routeLivro: "/biblioteca-fora-da-toga/livro",
    campoNome: "livro",
    campoImagem: "capa-livro",
    key: "fora",
  },
];

// Carrossel automático contínuo de capas (apenas visual, sem clique)
const AutoCarouselCapas = ({ 
  config, 
  items, 
  isLoading 
}: { 
  config: BibliotecaConfig; 
  items: ItemEmAlta[];
  isLoading: boolean;
}) => {
  const Icon = config.icon;

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-[70px] h-[100px] rounded-lg flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  // Duplicar items para criar efeito de loop infinito
  const duplicatedItems = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-3"
        animate={{
          x: [`0%`, `-50%`]
        }}
        transition={{
          x: {
            duration: items.length * 2.5,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop"
          }
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex-shrink-0 w-[70px]"
          >
            <div 
              className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10"
              style={{ boxShadow: `0 2px 8px ${config.color}20` }}
            >
              {item.imagem ? (
                <img
                  src={item.imagem}
                  alt={item.nome}
                  className="w-full h-full object-cover brightness-95"
                  loading="lazy"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${config.color}30, ${config.color}10)` }}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <p className="text-[9px] text-white/90 font-medium line-clamp-2 leading-tight">
                  {item.nome}
                </p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Carrossel padrão com clique (usado quando não há biblioteca selecionada)
const CarouselEmAlta = ({ 
  config, 
  items, 
  isLoading 
}: { 
  config: BibliotecaConfig; 
  items: ItemEmAlta[];
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  const Icon = config.icon;

  const handleItemClick = (item: ItemEmAlta) => {
    if (config.mostrarArea) {
      navigate(`${config.route}?area=${encodeURIComponent(item.nome)}`);
    } else {
      navigate(`${config.routeLivro}/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: config.color }} />
            <span className="text-sm font-semibold text-white/90">{config.titulo}</span>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-[100px] h-[140px] rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5" style={{ color: config.color }} />
          <span className="text-sm font-semibold text-white/90">{config.titulo}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(config.route)}
          className="text-xs text-white/70 hover:text-white hover:bg-white/10 gap-1 h-7 px-2"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex-shrink-0 w-[120px] group"
            >
              <div 
                className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/20 group-hover:border-white/40 transition-all shadow-lg"
                style={{ boxShadow: `0 4px 16px ${config.color}30, 0 0 20px rgba(255,255,255,0.05)` }}
              >
                {item.imagem ? (
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 brightness-110"
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${config.color}30, ${config.color}10)` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: config.color }} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.2) 50%, transparent 70%)' }} />
                
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[11px] text-white font-semibold line-clamp-2 leading-tight drop-shadow-md">
                    {item.nome}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface BibliotecasEmAltaSectionProps {
  bibliotecaSelecionada?: string;
}

export const BibliotecasEmAltaSection = ({ bibliotecaSelecionada }: BibliotecasEmAltaSectionProps) => {
  const { data: acessos } = useQuery({
    queryKey: ["bibliotecas-acessos-ranking"],
    queryFn: async () => {
      const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('bibliotecas_acessos')
        .select('biblioteca_tabela, item_id')
        .gte('created_at', seteDiasAtras);
      
      return (data || []) as Array<{ biblioteca_tabela: string; item_id: number }>;
    },
    staleTime: 1000 * 60 * 5,
  });

  const acessosPorBiblioteca = (tabela: string): Map<number, number> => {
    const contagem = new Map<number, number>();
    acessos?.filter(a => a.biblioteca_tabela === tabela)
      .forEach(a => {
        contagem.set(a.item_id, (contagem.get(a.item_id) || 0) + 1);
      });
    return contagem;
  };

  const { data: classicosData, isLoading: loadingClassicos } = useQuery({
    queryKey: ["biblioteca-classicos-emalta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-CLASSICOS" as any)
        .select("id, livro, imagem")
        .not("imagem", "is", null)
        .limit(10);
      return data || [];
    },
  });

  const { data: estudosData, isLoading: loadingEstudos } = useQuery({
    queryKey: ["biblioteca-estudos-emalta-areas-v3"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-ESTUDOS" as any)
        .select("id, \"Área\", url_capa_gerada, \"Capa-livro\", Ordem")
        .order("Ordem");
      
      const areasMap = new Map<string, any>();
      data?.forEach((item: any) => {
        const area = item["Área"];
        if (!area) return;
        
        if (!areasMap.has(area)) {
          const capa = item.url_capa_gerada || item["Capa-livro"];
          areasMap.set(area, { id: item.id, Área: area, capa_final: capa });
        } else if (!areasMap.get(area).capa_final) {
          const capa = item.url_capa_gerada || item["Capa-livro"];
          if (capa) {
            areasMap.get(area).capa_final = capa;
          }
        }
      });
      return Array.from(areasMap.values());
    },
  });

  const { data: oabData, isLoading: loadingOab } = useQuery({
    queryKey: ["biblioteca-oab-emalta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBILIOTECA-OAB" as any)
        .select("id, \"Área\", \"Capa-area\"")
        .not("Capa-area", "is", null);
      
      const areasMap = new Map<string, any>();
      data?.forEach((item: any) => {
        const area = item["Área"];
        if (area && !areasMap.has(area)) {
          areasMap.set(area, item);
        }
      });
      return Array.from(areasMap.values()).slice(0, 10);
    },
  });

  const { data: oratoriaData, isLoading: loadingOratoria } = useQuery({
    queryKey: ["biblioteca-oratoria-emalta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-ORATORIA" as any)
        .select("id, livro, imagem")
        .not("imagem", "is", null)
        .limit(10);
      return data || [];
    },
  });

  const { data: liderancaData, isLoading: loadingLideranca } = useQuery({
    queryKey: ["biblioteca-lideranca-emalta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-LIDERANÇA" as any)
        .select("id, livro, imagem")
        .not("imagem", "is", null)
        .limit(10);
      return data || [];
    },
  });

  const { data: foraData, isLoading: loadingFora } = useQuery({
    queryKey: ["biblioteca-fora-emalta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-FORA-DA-TOGA" as any)
        .select("id, livro, \"capa-livro\"")
        .not("capa-livro", "is", null)
        .limit(10);
      return data || [];
    },
  });

  const ordenarItens = (
    items: any[], 
    tabela: string, 
    campoNome: string, 
    campoImagem: string
  ): ItemEmAlta[] => {
    if (!items || items.length === 0) return [];
    
    const contagemAcessos = acessosPorBiblioteca(tabela);
    const temAcessos = contagemAcessos.size > 0;
    
    const mapped: ItemEmAlta[] = items.map(item => ({
      id: item.id,
      nome: item[campoNome] || 'Sem título',
      imagem: item[campoImagem] || item.imagem || item["capa-livro"] || item["Capa-area"],
      total_acessos: contagemAcessos.get(item.id) || 0,
    }));
    
    if (temAcessos) {
      return mapped.sort((a, b) => b.total_acessos - a.total_acessos);
    } else {
      return mapped.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
  };

  const estudosOrdenados = ordenarItens(estudosData || [], "BIBLIOTECA-ESTUDOS", "Área", "capa_final");
  const classicosOrdenados = ordenarItens(classicosData || [], "BIBLIOTECA-CLASSICOS", "livro", "imagem");
  const oabOrdenados = ordenarItens(oabData || [], "BIBILIOTECA-OAB", "Área", "Capa-area");
  const oratoriaOrdenados = ordenarItens(oratoriaData || [], "BIBLIOTECA-ORATORIA", "livro", "imagem");
  const liderancaOrdenados = ordenarItens(liderancaData || [], "BIBLIOTECA-LIDERANÇA", "livro", "imagem");
  const foraOrdenados = ordenarItens(foraData || [], "BIBLIOTECA-FORA-DA-TOGA", "livro", "capa-livro");

  const dataMap: Record<string, { items: ItemEmAlta[]; isLoading: boolean; config: BibliotecaConfig }> = {
    estudos: { items: estudosOrdenados, isLoading: loadingEstudos, config: bibliotecasConfig[0] },
    classicos: { items: classicosOrdenados, isLoading: loadingClassicos, config: bibliotecasConfig[1] },
    oab: { items: oabOrdenados, isLoading: loadingOab, config: bibliotecasConfig[2] },
    oratoria: { items: oratoriaOrdenados, isLoading: loadingOratoria, config: bibliotecasConfig[3] },
    lideranca: { items: liderancaOrdenados, isLoading: loadingLideranca, config: bibliotecasConfig[4] },
    fora: { items: foraOrdenados, isLoading: loadingFora, config: bibliotecasConfig[5] },
  };

  // Se uma biblioteca específica foi selecionada, mostrar seção "Sobre" + carrossel auto
  if (bibliotecaSelecionada) {
    const selected = dataMap[bibliotecaSelecionada];
    if (!selected) return null;

    const Icon = selected.config.icon;

    return (
      <div className="bg-neutral-900 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={bibliotecaSelecionada}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Seção Sobre */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: `${selected.config.color}20` }}
                >
                  <Info className="w-4 h-4" style={{ color: selected.config.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Sobre esta biblioteca
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {selected.config.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Carrossel automático de capas */}
            <AutoCarouselCapas 
              config={selected.config} 
              items={selected.items} 
              isLoading={selected.isLoading} 
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Comportamento padrão: mostrar todos os carrosséis
  return (
    <div className="space-y-8 bg-neutral-900">
      <CarouselEmAlta 
        config={bibliotecasConfig[1]} 
        items={classicosOrdenados} 
        isLoading={loadingClassicos} 
      />
      <CarouselEmAlta 
        config={bibliotecasConfig[0]} 
        items={estudosOrdenados} 
        isLoading={loadingEstudos} 
      />
      <CarouselEmAlta 
        config={bibliotecasConfig[2]} 
        items={oabOrdenados} 
        isLoading={loadingOab} 
      />
      <CarouselEmAlta 
        config={bibliotecasConfig[3]} 
        items={oratoriaOrdenados} 
        isLoading={loadingOratoria} 
      />
      <CarouselEmAlta 
        config={bibliotecasConfig[4]} 
        items={liderancaOrdenados} 
        isLoading={loadingLideranca} 
      />
      <CarouselEmAlta 
        config={bibliotecasConfig[5]} 
        items={foraOrdenados} 
        isLoading={loadingFora} 
      />
    </div>
  );
};

export default BibliotecasEmAltaSection;
