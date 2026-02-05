import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Eye, 
  TrendingUp,
  ArrowRight,
  Newspaper,
  Heart,
  Library
} from "lucide-react";
import { RankingPreview } from "@/components/RankingPreview";
import { RankingPreviewSenado } from "@/components/RankingPreviewSenado";
import { PoliticianTypeTabs, PoliticianType } from "@/components/PoliticianTypeTabs";

import { RankingUnificadoPreview } from "@/components/RankingUnificadoPreview";
import { PageHero } from "@/components/PageHero";
import { 
  NoticiasPorOrientacao, 
  EstudosPoliticosSection,
  PoliticaLivros
} from "@/components/politica";
import ResumosDisponiveisCarousel from '@/components/ResumosDisponiveisCarousel';

type OrientacaoType = 'esquerda' | 'centro' | 'direita';

const Politica = () => {
  const navigate = useNavigate();
  const [politicianType, setPoliticianType] = useState<PoliticianType>('deputados');
  const [activeTab, setActiveTab] = useState('feed');
  const [orientacaoBiblioteca, setOrientacaoBiblioteca] = useState<OrientacaoType>('esquerda');

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950 pb-20">
      <PageHero
        title="Política"
        subtitle="Estou te vendo 👁️ Transparência"
        icon={Eye}
        iconGradient="from-red-500/20 to-red-600/10"
        iconColor="text-red-400"
        lineColor="via-red-500"
        pageKey="politica"
        showGenerateButton={true}
        showBackButton={false}
      />

      {/* Tabs principais */}
      <div className="px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 bg-card/50 h-auto min-h-[44px]">
            <TabsTrigger value="feed" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3">
              <Newspaper className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="biblioteca" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3">
              <Library className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">Biblioteca</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3">
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">Favoritos</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Feed - Estudos Políticos, Boletins e Notícias */}
          <TabsContent value="feed" className="space-y-6">
            {/* Seção Estudos Políticos - 3 cards */}
            <EstudosPoliticosSection />
            
            {/* Carrossel de Boletins Políticos */}
            <ResumosDisponiveisCarousel tipo="politica" />
            
            {/* Notícias gerais */}
            <NoticiasPorOrientacao orientacao="todos" />
          </TabsContent>

          {/* Tab: Biblioteca - Sub-abas Esquerda, Centro, Direita */}
          <TabsContent value="biblioteca" className="space-y-4">
            <div className="animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Library className="w-5 h-5 text-red-400" />
                <h2 className="font-semibold text-base text-white">Biblioteca Política</h2>
              </div>

              {/* Sub-abas de orientação */}
              <ToggleGroup 
                type="single" 
                value={orientacaoBiblioteca} 
                onValueChange={(value) => value && setOrientacaoBiblioteca(value as OrientacaoType)}
                className="justify-start gap-2 mb-4"
              >
                <ToggleGroupItem 
                  value="esquerda" 
                  className="data-[state=on]:bg-red-600 data-[state=on]:text-white px-4 py-2 rounded-full border border-red-500/30 hover:bg-red-600/20"
                >
                  Esquerda
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="centro" 
                  className="data-[state=on]:bg-purple-600 data-[state=on]:text-white px-4 py-2 rounded-full border border-purple-500/30 hover:bg-purple-600/20"
                >
                  Centro
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="direita" 
                  className="data-[state=on]:bg-blue-600 data-[state=on]:text-white px-4 py-2 rounded-full border border-blue-500/30 hover:bg-blue-600/20"
                >
                  Direita
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Lista de livros da orientação selecionada */}
              <PoliticaLivros orientacao={orientacaoBiblioteca} />
            </div>
          </TabsContent>

          {/* Tab: Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            {/* Preview do Ranking Unificado */}
            <RankingUnificadoPreview onClick={() => navigate('/politica/rankings/unificado')} />

            {/* Rankings Grid */}
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                  <h2 className="font-semibold text-base text-white">Rankings</h2>
                </div>
                <button
                  onClick={() => navigate(`/politica/rankings?tipo=${politicianType}`)}
                  className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Ver todos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <PoliticianTypeTabs selected={politicianType} onChange={setPoliticianType} />
              </div>
              
              {politicianType === 'deputados' ? (
                <div className="grid grid-cols-2 gap-3">
                  <RankingPreview tipo="despesas" onClick={() => navigate('/politica/rankings/despesas')} />
                  <RankingPreview tipo="proposicoes" onClick={() => navigate('/politica/rankings/proposicoes')} />
                  <RankingPreview tipo="presenca" onClick={() => navigate('/politica/rankings/presenca')} />
                  <RankingPreview tipo="comissoes" onClick={() => navigate('/politica/rankings/comissoes')} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <RankingPreviewSenado tipo="despesas" onClick={() => navigate('/politica/rankings/senadores/despesas')} />
                  <RankingPreviewSenado tipo="materias" onClick={() => navigate('/politica/rankings/senadores/materias')} />
                  <RankingPreviewSenado tipo="discursos" onClick={() => navigate('/politica/rankings/senadores/discursos')} />
                  <RankingPreviewSenado tipo="comissoes" onClick={() => navigate('/politica/rankings/senadores/comissoes')} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Favoritos */}
          <TabsContent value="favoritos" className="space-y-6">
            <div className="text-center py-12 animate-fade-in">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-white mb-2">Seus Favoritos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Salve artigos e documentários para acessar depois
              </p>
              <p className="text-xs text-muted-foreground">
                Funcionalidade em desenvolvimento
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Politica;
