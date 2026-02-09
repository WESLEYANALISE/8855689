import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, Calendar, Bell, ChevronRight, Search, ScrollText, FileText, BookText, HandCoins, Landmark, PenTool, Scroll, Newspaper } from "lucide-react";
import brasaoRepublica from "@/assets/brasao-republica.png";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";
import heroVadeMecumBusca from "@/assets/hero-vademecum-busca.webp";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";

// Categorias de Legislação para o grid
const categoriasLegislacao = [
  { id: "constituicao", title: "Constituição", description: "CF/88 completa e atualizada", icon: Landmark, route: "/vade-mecum?categoria=constituicao" },
  { id: "codigos", title: "Códigos", description: "Civil, Penal, CPC, CPP...", icon: Scale, route: "/vade-mecum?categoria=codigos" },
  { id: "legislacao-penal", title: "Legislação Penal", description: "Lei de Drogas, Maria da Penha...", icon: Gavel, route: "/vade-mecum?categoria=legislacao-penal" },
  { id: "estatutos", title: "Estatutos", description: "ECA, Idoso, OAB, Cidade...", icon: BookOpen, route: "/vade-mecum?categoria=estatutos" },
  { id: "previdenciario", title: "Previdenciário", description: "Lei 8.213, Lei 8.212...", icon: HandCoins, route: "/resumos-juridicos/artigos-lei/previdenciario" },
  { id: "sumulas", title: "Súmulas", description: "STF, STJ, TST, Vinculantes", icon: BookText, route: "/resumos-juridicos/artigos-lei/sumulas" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", description: "Legislação esparsa federal", icon: ScrollText, route: "/vade-mecum?categoria=leis-ordinarias" },
  { id: "pec", title: "PEC", description: "Propostas de Emenda", icon: PenTool, route: "/vade-mecum?categoria=pec" },
];

// Tabs do menu de rodapé
type FooterTab = "legislacao" | "busca" | "explicacao" | "resenha" | "push";

export const MobileVadeMecumHome = memo(() => {
  const navigate = useNavigate();
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>("legislacao");

  const footerItems = [
    { id: "legislacao" as FooterTab, label: "Legislação", icon: Scale },
    { id: "busca" as FooterTab, label: "Buscar", icon: Search },
    { id: "explicacao" as FooterTab, label: "Explicação", icon: BookOpen },
    { id: "resenha" as FooterTab, label: "Resenha", icon: Newspaper },
    { id: "push" as FooterTab, label: "Push", icon: Bell },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Hero Background Full Screen FIXO */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ top: '160px' }}>
        {/* Background principal */}
        <img
          src={activeFooterTab === "busca" ? heroVadeMecumBusca : heroVadeMecumPlanalto}
          alt="Vade Mecum"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0) 0%,
              hsl(var(--background) / 0.15) 30%,
              hsl(var(--background) / 0.5) 60%,
              hsl(var(--background) / 0.9) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-amber-800/30">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Vade Mecum X</h2>
              <p className="text-sm text-muted-foreground">
                Seu Vade Mecum Jurídico <span className="text-amber-400 font-semibold">2026</span>
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto">
          {/* Aba Legislação - Grid de Categorias */}
          {activeFooterTab === "legislacao" && (
            <div className="px-4 pb-8 pt-2 space-y-3">
              {/* Header da seção */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Scale className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-blue-100 tracking-tight">
                    Legislação
                  </h3>
                  <p className="text-white/70 text-xs">
                    Acesse a legislação brasileira
                  </p>
                </div>
              </div>

              {/* Container azul com grid */}
              <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-blue-800/30">
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {categoriasLegislacao.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => navigate(item.route)} 
                        className="group bg-white/15 rounded-2xl p-3 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-2 border border-white/10 hover:border-white/20 overflow-hidden relative h-[130px]"
                        style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
                      >
                        <div className="bg-white/20 rounded-xl p-2 w-fit group-hover:bg-white/30 transition-colors shadow-lg">
                          <Icon className="w-5 h-5 text-amber-100 drop-shadow-md" />
                        </div>
                        <div>
                          <h4 className="font-playfair text-sm font-bold text-amber-100 mb-0.5 group-hover:translate-x-0.5 transition-transform tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-white line-clamp-2 leading-snug" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="absolute bottom-2 right-2 w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seção do Brasão */}
              <div className="mt-6 text-center">
                <div className="inline-flex flex-col items-center">
                  <img 
                    src={brasaoRepublica} 
                    alt="Brasão da República Federativa do Brasil" 
                    className="w-16 h-16 object-contain mb-3 drop-shadow-lg"
                  />
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    Seu Vade Mecum Digital
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Acesse a legislação brasileira sempre atualizada
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aba Busca */}
          {activeFooterTab === "busca" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Search className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Busca Avançada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesse o Vade Mecum completo para buscar artigos, leis e códigos
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum?tab=busca')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Abrir Busca Completa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Explicação */}
          {activeFooterTab === "explicacao" && (
            <div className="px-4 pb-8 pt-6">
              <ExplicacoesList />
            </div>
          )}

          {/* Aba Resenha Diária */}
          {activeFooterTab === "resenha" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Newspaper className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Resenha Diária</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acompanhe as novas leis publicadas no Diário Oficial da União todos os dias
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum/resenha-diaria')}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Ver Resenha Diária
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Push de Legislação */}
          {activeFooterTab === "push" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Bell className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Push de Legislação</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Receba alertas sobre novas leis diretamente no seu e-mail ou dispositivo
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum/push-legislacao')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Configurar Alertas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu de Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-1">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFooterTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveFooterTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all min-w-[56px] ${
                  isActive 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MobileVadeMecumHome.displayName = 'MobileVadeMecumHome';

export default MobileVadeMecumHome;
