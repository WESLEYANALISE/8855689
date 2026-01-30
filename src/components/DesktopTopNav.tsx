import { useNavigate } from "react-router-dom";
import { Search, GraduationCap, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { DesktopAuthButtons } from "@/components/DesktopAuthButtons";
import { motion } from "framer-motion";
import { UniversalImage } from "@/components/ui/universal-image";

// Hero images em /public para preload instantâneo via index.html
const HERO_IMAGES = [
  '/hero-banner-themis-advogado-v2.webp',
  '/hero-banner-themis-chorando.webp',
  '/hero-banner-tribunal.webp'
];

export const DesktopTopNav = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Usa a mesma imagem que foi selecionada no Index
  const heroBanner = useMemo(() => {
    const currentIndex = parseInt(localStorage.getItem('heroImageIndex') || '0', 10);
    return HERO_IMAGES[currentIndex];
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pesquisar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleProfessoraClick = () => {
    navigate('/professora');
  };

  return (
    <header className="w-full relative z-10">
      {/* Top Bar com Hero Banner */}
      <div className="relative h-28 overflow-hidden">
        {/* Background Image com UniversalImage */}
        <UniversalImage
          src={heroBanner}
          alt="Hero Banner"
          priority={true}
          blurCategory="hero"
          containerClassName="absolute inset-0"
          className="object-cover object-center"
        />
        {/* Overlay gradient suave - imagem levemente visível */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0a]/90 via-[#1a0a0a]/70 to-[#1a0a0a]/90" />
        
        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-8 flex items-center justify-between">
          {/* Logo à esquerda - Clicável para voltar ao início */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo.webp" 
              alt="Direito X - Estudos Jurídicos" 
              className="w-12 h-12 rounded-xl object-cover shadow-lg ring-2 ring-white/20"
              loading="eager"
              decoding="sync"
            />
            <div className="flex flex-col text-left">
              <span className="text-2xl font-bold text-white tracking-tight font-playfair">
                DIREITO X
              </span>
              <span className="text-xs text-white/70 tracking-widest uppercase">
                Estudos Jurídicos
              </span>
            </div>
          </button>

          {/* Ações à direita */}
          <div className="flex items-center gap-3">
            <DesktopAuthButtons />
          </div>
        </div>
      </div>

      {/* Navigation Bar - Professora à esquerda, pesquisa à direita */}
      <div className="bg-gradient-to-r from-[#1a0a0a] via-[#2a0f0f] to-[#1a0a0a] border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-14">
          {/* Botão Professora - Elegante à esquerda */}
          <motion.button
            onClick={handleProfessoraClick}
            className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600/20 to-amber-500/10 border border-amber-500/30 hover:border-amber-400/50 hover:from-amber-600/30 hover:to-amber-500/20 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-1.5 rounded-full bg-amber-500/20">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-playfair text-base font-semibold text-amber-100 tracking-wide">
              Professora
            </span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </motion.div>
          </motion.button>

          {/* Barra de Pesquisa - Branca à direita */}
          <form onSubmit={handleSearch} className="w-full max-w-md ml-auto">
            <div className="relative group">
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-500 group-focus-within:text-gray-700 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 bg-white text-gray-800 placeholder:text-gray-400 border border-white/80 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 shadow-lg transition-all duration-300"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};
