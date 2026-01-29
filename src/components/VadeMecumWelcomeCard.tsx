import { useState, useEffect } from "react";
import { X, Scale, FileText, Gavel, Crown } from "lucide-react";
import { useLocation } from "react-router-dom";
import heroImage from "@/assets/hero-vademecum-planalto.webp";

const VadeMecumWelcomeCard = () => {
  const location = useLocation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCard, setShowCard] = useState(true);
  
  // Verificação SÍNCRONA para aparecer PRIMEIRO - sem delay
  const [isVisible, setIsVisible] = useState(() => {
    const hasSeenWelcome = sessionStorage.getItem('vadeMecumWelcomeSeen');
    if (hasSeenWelcome === 'true') return false;
    
    const previousPath = sessionStorage.getItem('vadeMecumPreviousPath');
    const vadeMecumSubPaths = [
      '/constituicao', '/codigos', '/codigo/', '/estatutos', '/estatuto/',
      '/legislacao-penal', '/lei-penal/', '/sumulas', '/previdenciario',
      '/leis-ordinarias', '/camara-deputados', '/vade-mecum/'
    ];
    
    const isReturningFromSubPage = vadeMecumSubPaths.some(path => 
      previousPath?.startsWith(path)
    );
    
    if (isReturningFromSubPage) {
      sessionStorage.setItem('vadeMecumWelcomeSeen', 'true');
      return false;
    }
    
    return true;
  });

  // Pré-carregar a imagem
  useEffect(() => {
    if (!isVisible) return;
    
    const img = new Image();
    img.src = heroImage;
    
    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = () => setImageLoaded(true);
    }
  }, [isVisible]);

  // Salva o path atual sempre que mudar de página
  useEffect(() => {
    return () => {
      sessionStorage.setItem('vadeMecumPreviousPath', location.pathname);
    };
  }, [location.pathname]);

  const handleClose = () => {
    setShowCard(false);
    setIsVisible(false);
    sessionStorage.setItem('vadeMecumWelcomeSeen', 'true');
  };

  const stats = [
    { icon: Crown, label: "Constituição Federal", value: "250+ artigos" },
    { icon: Scale, label: "Códigos", value: "15+ códigos" },
    { icon: FileText, label: "Leis Especiais", value: "50+ leis" },
    { icon: Gavel, label: "Súmulas", value: "1000+ súmulas" },
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[49]"
      />
      
      {/* Card estático - sem animação */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-gradient-to-br from-card via-card to-card/95 rounded-3xl overflow-hidden shadow-2xl border border-white/10 max-w-md w-full"
        >
          {/* Header com imagem */}
          <div className="relative h-48 overflow-hidden">
            {/* Skeleton enquanto carrega */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800" />
            )}
            
            <img
              src={heroImage}
              alt="Vade Mecum Elite"
              className={`w-full h-full object-cover ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="eager"
              decoding="sync"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">Vade Mecum Elite</span>
            </div>
            
            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            {/* Título sobre a imagem */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                Vade Mecum Atualizado 2026
              </h2>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="p-5 space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Acesse toda a legislação brasileira atualizada <span className="text-amber-400 font-semibold">diretamente do Planalto</span>. Da Constituição Federal aos códigos, estatutos e súmulas dos tribunais superiores.
            </p>
            
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-3 border border-white/5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-foreground font-semibold text-sm">{stat.value}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Botão CTA */}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20"
            >
              Começar a Explorar
            </button>
            
            <p className="text-center text-xs text-muted-foreground">
              Todas as leis são do Planalto • Atualizado 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default VadeMecumWelcomeCard;