import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Crown, 
  Users, 
  History, 
  Building, 
  BookText,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useGenericCache } from "@/hooks/useGenericCache";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const categorias = [
  {
    id: "presidentes",
    titulo: "Presidentes do Brasil",
    descricao: "Todos os presidentes, biografia e mandatos",
    icon: Crown,
    color: "from-yellow-500 to-amber-600",
    glowColor: "yellow"
  },
  {
    id: "figuras",
    titulo: "Figuras Políticas",
    descricao: "Políticos importantes na história",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    glowColor: "blue"
  },
  {
    id: "historia",
    titulo: "História Política",
    descricao: "Eventos marcantes da política brasileira",
    icon: History,
    color: "from-amber-500 to-orange-600",
    glowColor: "amber"
  },
  {
    id: "instituicoes",
    titulo: "Instituições",
    descricao: "Câmara, Senado, STF, TCU e mais",
    icon: Building,
    color: "from-green-500 to-emerald-600",
    glowColor: "green"
  },
  {
    id: "glossario",
    titulo: "Glossário Político",
    descricao: "CPI, PEC, Quórum e outros termos",
    icon: BookText,
    color: "from-purple-500 to-violet-600",
    glowColor: "purple"
  },
];

// Tópicos pré-definidos por categoria para gerar conteúdo inicial
const topicosIniciais: Record<string, { titulo: string; termo: string }[]> = {
  presidentes: [
    { titulo: "Getúlio Vargas", termo: "Getúlio Vargas" },
    { titulo: "Juscelino Kubitschek", termo: "Juscelino Kubitschek" },
    { titulo: "Tancredo Neves", termo: "Tancredo Neves" },
    { titulo: "Luiz Inácio Lula da Silva", termo: "Luiz Inácio Lula da Silva" },
    { titulo: "Fernando Henrique Cardoso", termo: "Fernando Henrique Cardoso" },
  ],
  figuras: [
    { titulo: "Ulysses Guimarães", termo: "Ulysses Guimarães" },
    { titulo: "Rui Barbosa", termo: "Rui Barbosa" },
    { titulo: "Tiradentes", termo: "Tiradentes" },
    { titulo: "Machado de Assis", termo: "Machado de Assis político" },
    { titulo: "Barão de Rio Branco", termo: "Barão do Rio Branco" },
  ],
  historia: [
    { titulo: "Proclamação da República", termo: "Proclamação da República do Brasil" },
    { titulo: "Golpe Militar de 1964", termo: "Golpe de Estado no Brasil em 1964" },
    { titulo: "Diretas Já", termo: "Diretas Já" },
    { titulo: "Impeachment de Collor", termo: "Impeachment de Fernando Collor" },
    { titulo: "Constituição de 1988", termo: "Constituição brasileira de 1988" },
  ],
  instituicoes: [
    { titulo: "Supremo Tribunal Federal", termo: "Supremo Tribunal Federal" },
    { titulo: "Congresso Nacional", termo: "Congresso Nacional do Brasil" },
    { titulo: "Câmara dos Deputados", termo: "Câmara dos Deputados do Brasil" },
    { titulo: "Senado Federal", termo: "Senado Federal do Brasil" },
    { titulo: "Tribunal de Contas da União", termo: "Tribunal de Contas da União" },
  ],
  glossario: [
    { titulo: "CPI - Comissão Parlamentar de Inquérito", termo: "Comissão Parlamentar de Inquérito" },
    { titulo: "PEC - Proposta de Emenda à Constituição", termo: "Proposta de Emenda à Constituição" },
    { titulo: "Medida Provisória", termo: "Medida provisória" },
    { titulo: "Impeachment", termo: "Impeachment no Brasil" },
    { titulo: "Quórum", termo: "Quórum" },
  ],
};

const PoliticaBlog = () => {
  const navigate = useNavigate();
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: artigos, isLoading, refresh } = useGenericCache<any[]>({
    cacheKey: `blogger-politico-${selectedCategoria}-${refreshKey}`,
    fetchFn: async () => {
      if (!selectedCategoria) return [];
      
      const { data, error } = await supabase
        .from('blogger_politico')
        .select('*')
        .eq('categoria', selectedCategoria)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!selectedCategoria
  });

  const gerarConteudo = async (titulo: string, termo: string, index: number) => {
    setGeneratingIndex(index);
    try {
      toast.info(`Gerando: ${titulo}`, { description: "Buscando na Wikipedia e gerando conteúdo..." });
      
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-politico', {
        body: { 
          categoria: selectedCategoria, 
          titulo, 
          termo_wikipedia: termo 
        }
      });

      if (error) throw error;

      toast.success(`Artigo gerado: ${titulo}`);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Erro ao gerar:', err);
      toast.error('Erro ao gerar conteúdo', { description: err.message });
    } finally {
      setGeneratingIndex(null);
    }
  };

  const gerarTodosArtigos = async () => {
    if (!selectedCategoria) return;
    
    const topicos = topicosIniciais[selectedCategoria] || [];
    if (topicos.length === 0) {
      toast.error('Nenhum tópico definido para esta categoria');
      return;
    }

    setIsGenerating(true);
    toast.info('Gerando artigos...', { description: `0/${topicos.length} concluídos` });

    for (let i = 0; i < topicos.length; i++) {
      const topico = topicos[i];
      setGeneratingIndex(i);
      
      try {
        await supabase.functions.invoke('gerar-conteudo-politico', {
          body: { 
            categoria: selectedCategoria, 
            titulo: topico.titulo, 
            termo_wikipedia: topico.termo 
          }
        });
        
        toast.info('Gerando artigos...', { description: `${i + 1}/${topicos.length} concluídos` });
      } catch (err: any) {
        console.error(`Erro ao gerar ${topico.titulo}:`, err);
      }
    }

    setIsGenerating(false);
    setGeneratingIndex(null);
    setRefreshKey(prev => prev + 1);
    toast.success('Artigos gerados com sucesso!');
  };

  // Tela de detalhes da categoria
  if (selectedCategoria) {
    const categoria = categorias.find(c => c.id === selectedCategoria);
    const topicosDisponiveis = topicosIniciais[selectedCategoria] || [];
    const Icon = categoria?.icon || BookOpen;
    
    return (
      <div className="min-h-screen bg-neutral-950">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/50 via-neutral-950/80 to-neutral-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent" />
          
          <motion.div 
            className="relative z-10 px-4 pt-6 pb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto">
              <button 
                onClick={() => setSelectedCategoria(null)}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar às categorias
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoria?.color} shadow-lg flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{categoria?.titulo}</h1>
                  <p className="text-sm text-neutral-400">{categoria?.descricao}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="px-4 pb-24 max-w-4xl mx-auto -mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : artigos && artigos.length > 0 ? (
            <div className="space-y-3">
              {artigos.map((artigo, index) => (
                <motion.div
                  key={artigo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer bg-neutral-900/80 backdrop-blur-sm border-white/5 hover:border-red-500/30 transition-all group overflow-hidden"
                    onClick={() => navigate(`/politica/blog/${artigo.id}`)}
                  >
                    <div className={`h-0.5 bg-gradient-to-r ${categoria?.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    
                    <CardContent className="p-4 flex items-center gap-4">
                      {artigo.url_capa || artigo.imagem_wikipedia ? (
                        <img 
                          src={artigo.url_capa || artigo.imagem_wikipedia || ''} 
                          alt={artigo.titulo}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${categoria?.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-8 h-8 text-white/80" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">{artigo.titulo}</h3>
                        <p className="text-sm text-neutral-500 line-clamp-2">{artigo.descricao_curta}</p>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Botão para gerar todos */}
              <Card className="bg-gradient-to-br from-red-500/10 to-purple-500/10 border-red-500/20 overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-red-500 to-purple-500" />
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">Gerar Artigos com IA</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Clique para gerar {topicosDisponiveis.length} artigos usando Wikipedia + Gemini
                  </p>
                  <Button 
                    onClick={gerarTodosArtigos}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Todos os Artigos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de tópicos disponíveis */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-400 px-1">Ou gerar individualmente:</h4>
                {topicosDisponiveis.map((topico, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer bg-neutral-900/80 backdrop-blur-sm border-white/5 hover:border-red-500/30 transition-all group overflow-hidden"
                    onClick={() => !isGenerating && gerarConteudo(topico.titulo, topico.termo, index)}
                  >
                    <div className="h-0.5 bg-gradient-to-r from-red-500/50 to-purple-500/50 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-white/5">
                        {generatingIndex === index ? (
                          <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white">{topico.titulo}</h3>
                        <p className="text-xs text-neutral-500">Clique para gerar</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela principal com categorias
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header com gradiente vermelho */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/50 via-neutral-950/80 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 px-4 pt-6 pb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Blog Político</h1>
                <p className="text-sm text-neutral-400">
                  Conheça a história política do Brasil
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de categorias */}
      <div className="px-4 pb-24 max-w-4xl mx-auto -mt-2">
        <div className="space-y-3">
          {categorias.map((categoria, index) => {
            const Icon = categoria.icon;
            return (
              <motion.div
                key={categoria.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
              >
                <Card
                  className="cursor-pointer bg-neutral-900/80 backdrop-blur-sm border-white/5 hover:border-red-500/30 transition-all duration-300 group overflow-hidden"
                  onClick={() => setSelectedCategoria(categoria.id)}
                >
                  {/* Linha decorativa no topo */}
                  <div className={`h-0.5 bg-gradient-to-r ${categoria.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${categoria.color} shadow-lg flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{categoria.titulo}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-1">{categoria.descricao}</p>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PoliticaBlog;
