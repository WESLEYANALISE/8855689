import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, ArrowRight, BookOpen, Scroll, Sparkles, Target, Brain, Calendar, FileText, GraduationCap, ListChecks, Download, Newspaper, HelpCircle, ClipboardList, Layers, Footprints, Info } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import oabAprovacaoCapa from "@/assets/oab-primeira-fase-aprovacao.webp";

type MaterialTab = 'materiais' | 'simulados' | 'informativo';

const PrimeiraFase = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [activeTab, setActiveTab] = useState<MaterialTab>('materiais');

  const materiaisItems = [
    { id: "biblioteca", title: "Biblioteca da OAB", description: "Livros e materiais OAB", icon: BookOpen, route: "/biblioteca-oab" },
    { id: "videoaulas", title: "Videoaulas", description: "Aulas em vídeo por área", icon: Video, route: "/videoaulas-oab-1fase" },
    { id: "resumos", title: "Resumos", description: "Conteúdo resumido", icon: Scroll, route: "/resumos-juridicos" },
    { id: "flashcards", title: "Flashcards", description: "Fixe conceitos com cartões", icon: Sparkles, route: "/flashcards" },
    { id: "questoes", title: "Questões", description: "Pratique com questões", icon: Target, route: "/ferramentas/questoes" },
    { id: "mapa-mental", title: "Mapa Mental", description: "Conecte institutos", icon: Brain, route: "/mapa-mental" },
    { id: "plano-estudos", title: "Plano de Estudos", description: "Organize sua preparação", icon: Calendar, route: "/plano-estudos" },
    { id: "dicionario", title: "Dicionário", description: "Termos jurídicos", icon: FileText, route: "/dicionario" },
  ];

  const simuladosItems = [
    { id: "provas", title: "Provas Anteriores", description: "Exames oficiais da OAB", icon: ClipboardList, route: "/simulados/exames" },
    { id: "materias", title: "Por Matéria", description: "Simulados organizados por área", icon: Layers, route: "/simulados/areas" },
  ];

  const informativoItems = [
    { id: "downloads", title: "Baixar PDFs", description: "Provas e gabaritos oficiais", icon: Download, route: "/downloads-oab" },
    { id: "noticias", title: "Notícias", description: "Últimas notícias da OAB", icon: Newspaper, route: "/oab/noticias" },
    { id: "faq", title: "Perguntas Frequentes", description: "Dúvidas sobre o Exame", icon: HelpCircle, route: "/oab/faq" },
    { id: "calendario", title: "Calendário de Provas", description: "Datas dos próximos exames", icon: Calendar, route: "/oab/calendario" },
  ];


  const getCurrentItems = () => {
    switch (activeTab) {
      case 'materiais':
        return materiaisItems;
      case 'simulados':
        return simuladosItems;
      case 'informativo':
        return informativoItems;
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'materiais':
        return 'Ferramentas de aprendizado';
      case 'simulados':
        return 'Provas e exercícios';
      case 'informativo':
        return 'PDFs, notícias e FAQ';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/?tab=oab')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">OAB 1ª Fase</h1>
            <p className="text-sm text-muted-foreground">Prova Objetiva - 80 questões</p>
          </div>
        </div>

        {/* Card Trilhas da Aprovação */}
        <div className="overflow-hidden rounded-3xl bg-card border border-border">
          {/* Capa brilhante sem gradiente */}
          <div className="relative aspect-[16/9]">
            <img 
              src={oabAprovacaoCapa} 
              alt="OAB 1ª Fase - Seja Aprovado de Primeira" 
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          </div>
          
          {/* Conteúdo abaixo da capa */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-900/40 text-red-400 border border-red-700/50">
                <Footprints className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  Trilhas da Aprovação
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estude por área com conteúdo completo
                </p>
              </div>
              
              {/* Botão Acessar */}
              <button 
                onClick={() => navigate('/oab/trilhas-aprovacao')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                <Footprints className="w-4 h-4" />
                Acessar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Espaçamento entre os cards */}
        <div className="h-2" />

        {/* Material de Estudos com Toggle */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="bg-red-900/20 ring-red-800/30 rounded-2xl p-3 shadow-lg ring-1">
                <GraduationCap className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                  Material de Estudos
                </h3>
                <p className="text-muted-foreground text-xs">
                  {getTabDescription()}
                </p>
              </div>
            </div>
            
            {/* Toggle Menu - Responsivo com scroll horizontal */}
            <div className="mb-4 relative z-10 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="inline-flex items-center bg-neutral-800/80 rounded-full p-1 gap-0.5 min-w-max">
                <button
                  onClick={() => setActiveTab('materiais')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'materiais'
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Materiais</span>
                </button>
                <button
                  onClick={() => setActiveTab('simulados')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'simulados'
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  <span>Simulados</span>
                </button>
                <button
                  onClick={() => setActiveTab('informativo')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'informativo'
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span>Informativo</span>
                </button>
              </div>
            </div>
            
            {/* Content based on active tab */}
            <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {getCurrentItems().map((item) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => navigate(item.route)} 
                    className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl p-3 text-left transition-colors duration-150 flex flex-col gap-2 shadow-lg border border-white/5 hover:border-white/10 overflow-hidden h-[130px]"
                  >
                    <div className="bg-red-900/20 rounded-xl p-2 w-fit group-hover:bg-red-900/30 transition-colors shadow-lg">
                      <Icon className="text-red-400 drop-shadow-md w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors drop-shadow-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimeiraFase;
