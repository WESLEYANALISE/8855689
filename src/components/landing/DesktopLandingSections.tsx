import { motion, type Easing } from 'framer-motion';
import { Book, Brain, GraduationCap, Library, Landmark, Newspaper, Film, Crown, Search, Star, MessageCircle, Scale, Users, Gavel, FileText, Sparkles, CheckCircle, Award, Target, BookOpen } from 'lucide-react';

// Import images
import vadeMecumImg from '@/assets/landing/vade-mecum-section.webp';
import evelynImg from '@/assets/landing/evelyn-ai-section.webp';
import estudosImg from '@/assets/landing/estudos-section.webp';
import bibliotecaImg from '@/assets/landing/biblioteca-section.webp';
import politicaImg from '@/assets/landing/politica-section.webp';
import noticiasImg from '@/assets/landing/noticias-section.webp';
import juriflixImg from '@/assets/landing/juriflix-section.webp';
import ctaImg from '@/assets/landing/cta-section.webp';
import oabImg from '@/assets/landing/oab-section.webp';
import concursoImg from '@/assets/landing/concurso-section.webp';
import materiaisImg from '@/assets/landing/materiais-section.webp';

const easeOutQuart: Easing = [0.25, 0.46, 0.45, 0.94];

// Animation variants for text coming from LEFT
const fromLeftVariants = {
  hidden: { opacity: 0, x: -80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, ease: easeOutQuart }
  }
};

// Animation variants for text coming from RIGHT
const fromRightVariants = {
  hidden: { opacity: 0, x: 80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, ease: easeOutQuart }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 1.2, ease: easeOutQuart }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as Easing }
  }
};

// Feature Highlight Component (no navigation)
interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureHighlight = ({ icon, title, description }: FeatureHighlightProps) => (
  <motion.div 
    variants={fadeUpVariants}
    className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300"
  >
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-3 text-white">
      {icon}
    </div>
    <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
    <p className="text-white/50 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

// Stat Display Component
interface StatDisplayProps {
  value: string;
  label: string;
}

const StatDisplay = ({ value, label }: StatDisplayProps) => (
  <motion.div 
    variants={fadeUpVariants}
    className="text-center"
  >
    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-[hsl(var(--gold))] to-primary bg-clip-text text-transparent">
      {value}
    </span>
    <p className="text-white/50 text-xs mt-1 uppercase tracking-wider">{label}</p>
  </motion.div>
);

// Bullet Point Component
interface BulletPointProps {
  text: string;
}

const BulletPoint = ({ text }: BulletPointProps) => (
  <motion.div 
    variants={fadeUpVariants}
    className="flex items-center gap-3"
  >
    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
    <span className="text-white/80 text-sm">{text}</span>
  </motion.div>
);

export function DesktopLandingSections() {
  return (
    <div className="bg-background">

      {/* Section 1: Vade Mecum - Text from LEFT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={vadeMecumImg} 
            alt="Vade Mecum" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          {/* Bottom fade for smooth transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromLeftVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary text-sm font-medium mb-6"
              >
                <Book className="w-4 h-4" />
                Legislação Completa
              </motion.span>
              
              <motion.h2 
                variants={fromLeftVariants}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
              >
                Vade Mecum
                <span className="block text-primary">Inteligente</span>
              </motion.h2>
              
              <motion.p 
                variants={fromLeftVariants}
                className="text-xl text-white/70 mb-8 leading-relaxed"
              >
                Acesse todos os códigos e leis brasileiras organizados de forma intuitiva. 
                Com busca avançada, favoritos, grifos personalizados e explicações de cada artigo 
                geradas por Inteligência Artificial.
              </motion.p>
              
              <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4">
                <motion.div variants={fromLeftVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white/80">Busca Avançada</span>
                </motion.div>
                <motion.div variants={fromLeftVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white/80">Favoritos & Grifos</span>
                </motion.div>
                <motion.div variants={fromLeftVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white/80">Explicações com IA</span>
                </motion.div>
                <motion.div variants={fromLeftVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white/80">+200 Leis</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 2: Estudar para OAB - Text from RIGHT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={oabImg} 
            alt="Estudar para OAB" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black via-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-2xl ml-auto text-right">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromRightVariants}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
              >
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                Exame da Ordem
              </motion.span>
              
              <motion.h2 
                variants={fromRightVariants}
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight font-playfair"
              >
                Estudar para
                <span className="block text-amber-400">OAB</span>
              </motion.h2>
              
              <motion.p 
                variants={fromRightVariants}
                className="text-base sm:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed"
              >
                Prepare-se para o Exame da Ordem com materiais completos, 
                questões comentadas e simulados. Sua aprovação começa aqui.
              </motion.p>

              <motion.div variants={staggerContainer} className="flex flex-col gap-2 sm:gap-3 items-end">
                <BulletPoint text="Questões de provas anteriores" />
                <BulletPoint text="Simulados completos" />
                <BulletPoint text="Videoaulas preparatórias" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 3: Estudar para Concurso - Text from LEFT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={concursoImg} 
            alt="Estudar para Concurso" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromLeftVariants}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
              >
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                Concursos Públicos
              </motion.span>
              
              <motion.h2 
                variants={fromLeftVariants}
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight font-playfair"
              >
                Estudar para
                <span className="block text-blue-400">Concurso Público</span>
              </motion.h2>
              
              <motion.p 
                variants={fromLeftVariants}
                className="text-base sm:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed"
              >
                Conquiste sua vaga no serviço público. Acesse questões, 
                resumos e materiais focados nas principais bancas examinadoras.
              </motion.p>

              <motion.div variants={staggerContainer} className="flex flex-col gap-2 sm:gap-3">
                <BulletPoint text="Questões por banca e cargo" />
                <BulletPoint text="Resumos esquematizados" />
                <BulletPoint text="Mapas mentais" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 4: Evelyn IA - Text from RIGHT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={evelynImg} 
            alt="Evelyn IA" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-2xl ml-auto text-right">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromRightVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6"
              >
                <Brain className="w-4 h-4" />
                Inteligência Artificial
              </motion.span>
              
              <motion.h2 
                variants={fromRightVariants}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
              >
                Evelyn
                <span className="block text-blue-400">Sua Assistente 24h</span>
              </motion.h2>
              
              <motion.p 
                variants={fromRightVariants}
                className="text-xl text-white/70 mb-8 leading-relaxed"
              >
                Tire dúvidas jurídicas, peça explicações de artigos, gere petições 
                e muito mais. Disponível via WhatsApp ou diretamente no app, 
                a qualquer hora do dia ou da noite.
              </motion.p>
              
              <motion.div variants={staggerContainer} className="flex flex-col gap-4 items-end">
                <motion.div variants={fromRightVariants} className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white/80">Chat Inteligente</span>
                </motion.div>
                <motion.div variants={fromRightVariants} className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white/80">Análise Jurídica</span>
                </motion.div>
                <motion.div variants={fromRightVariants} className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white/80">Geração de Petições</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 3: Estudos - Center with cards */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={estudosImg} 
            alt="Estudos" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.span 
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-6"
            >
              <GraduationCap className="w-4 h-4" />
              Prepare-se para o Sucesso
            </motion.span>
            
            <motion.h2 
              variants={fadeUpVariants}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
            >
              Domine o <span className="text-amber-400">Direito</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeUpVariants}
              className="text-xl text-white/70 mb-12 leading-relaxed max-w-3xl mx-auto"
            >
              Ferramentas completas para acelerar seus estudos e garantir aprovação 
              em concursos e na OAB.
            </motion.p>
            
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-5"
            >
              <FeatureHighlight 
                icon={<Book className="w-5 h-5" />}
                title="Flashcards"
                description="Memorize conceitos com repetição espaçada"
              />
              <FeatureHighlight 
                icon={<FileText className="w-5 h-5" />}
                title="Questões"
                description="Milhares de questões de concursos"
              />
              <FeatureHighlight 
                icon={<Brain className="w-5 h-5" />}
                title="Mapas Mentais"
                description="Visualize conexões entre conceitos"
              />
              <FeatureHighlight 
                icon={<GraduationCap className="w-5 h-5" />}
                title="Aulas Interativas"
                description="Aprenda com conteúdo dinâmico"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 4: Biblioteca - Text from LEFT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={bibliotecaImg} 
            alt="Biblioteca" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromLeftVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--gold))]/20 border border-[hsl(var(--gold))]/30 rounded-full text-[hsl(var(--gold))] text-sm font-medium mb-6"
              >
                <Library className="w-4 h-4" />
                Conhecimento Ilimitado
              </motion.span>
              
              <motion.h2 
                variants={fromLeftVariants}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
              >
                Biblioteca
                <span className="block text-[hsl(var(--gold))]">Digital Completa</span>
              </motion.h2>
              
              <motion.p 
                variants={fromLeftVariants}
                className="text-xl text-white/70 mb-8 leading-relaxed"
              >
                Acesso a milhares de livros jurídicos, clássicos do Direito, obras de 
                liderança e oratória. Leia, faça anotações e acompanhe seu progresso 
                de leitura.
              </motion.p>
              
              <motion.div variants={staggerContainer} className="flex flex-wrap gap-3">
                {['Direito Civil', 'Direito Penal', 'Constitucional', 'Trabalhista', 'Clássicos'].map((area) => (
                  <motion.span 
                    key={area}
                    variants={fromLeftVariants}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm"
                  >
                    {area}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 5: Política - Center with stats */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={politicaImg} 
            alt="Política" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.span 
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-6"
            >
              <Landmark className="w-4 h-4" />
              Transparência Política
            </motion.span>
            
            <motion.h2 
              variants={fadeUpVariants}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
            >
              Acompanhe a <span className="text-green-400">Política Nacional</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeUpVariants}
              className="text-xl text-white/70 mb-12 leading-relaxed max-w-3xl mx-auto"
            >
              Monitore votações, projetos de lei, despesas de parlamentares e 
              decisões dos Três Poderes em tempo real.
            </motion.p>
            
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto mb-8 sm:mb-12"
            >
              <StatDisplay value="513" label="Deputados" />
              <StatDisplay value="81" label="Senadores" />
              <StatDisplay value="11" label="Ministros STF" />
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-2 sm:px-0"
            >
              <motion.div 
                variants={fadeUpVariants}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h4 className="text-xs sm:text-sm md:text-lg font-semibold text-white leading-tight">Câmara dos Deputados</h4>
                <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 leading-tight">Acompanhe projetos e votações</p>
              </motion.div>
              <motion.div 
                variants={fadeUpVariants}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6"
              >
                <Landmark className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h4 className="text-xs sm:text-sm md:text-lg font-semibold text-white leading-tight">Senado Federal</h4>
                <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 leading-tight">Senadores e suas atividades</p>
              </motion.div>
              <motion.div 
                variants={fadeUpVariants}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6"
              >
                <Gavel className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h4 className="text-xs sm:text-sm md:text-lg font-semibold text-white leading-tight">Três Poderes</h4>
                <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 leading-tight">Executivo, Legislativo e Judiciário</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 6: Notícias - Text from RIGHT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={noticiasImg} 
            alt="Notícias" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-2xl ml-auto text-right">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromRightVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary text-sm font-medium mb-6"
              >
                <Newspaper className="w-4 h-4" />
                Sempre Atualizado
              </motion.span>
              
              <motion.h2 
                variants={fromRightVariants}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
              >
                Notícias
                <span className="block text-primary">Jurídicas</span>
              </motion.h2>
              
              <motion.p 
                variants={fromRightVariants}
                className="text-xl text-white/70 mb-8 leading-relaxed"
              >
                Fique por dentro das últimas novidades do mundo jurídico. 
                Notícias resumidas e explicadas pela Evelyn, com análises 
                aprofundadas dos principais acontecimentos.
              </motion.p>

              <motion.div variants={staggerContainer} className="flex flex-col gap-3 items-end">
                <BulletPoint text="Resumos diários das principais notícias" />
                <BulletPoint text="Análises jurídicas aprofundadas" />
                <BulletPoint text="Jurisprudências comentadas" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 7: JuriFlix - Text from LEFT */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={juriflixImg} 
            alt="JuriFlix" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span 
                variants={fromLeftVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-6"
              >
                <Film className="w-4 h-4" />
                Entretenimento Jurídico
              </motion.span>
              
              <motion.h2 
                variants={fromLeftVariants}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-playfair"
              >
                JuriFlix
                <span className="block text-red-500">Cinema do Direito</span>
              </motion.h2>
              
              <motion.p 
                variants={fromLeftVariants}
                className="text-xl text-white/70 mb-8 leading-relaxed"
              >
                Filmes, séries e documentários sobre o mundo jurídico. 
                Aprenda enquanto se diverte com as melhores produções 
                sobre tribunais, advogados e casos icônicos.
              </motion.p>

              <motion.div variants={staggerContainer} className="flex flex-col gap-3">
                <BulletPoint text="Curadoria de filmes e séries jurídicas" />
                <BulletPoint text="Documentários sobre casos reais" />
                <BulletPoint text="Análises sobre Direito no cinema" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Section 8: CTA Final */}
      <motion.section 
        className="min-h-screen flex items-center relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0">
          <motion.img 
            src={ctaImg} 
            alt="CTA" 
            className="w-full h-full object-cover"
            variants={imageVariants}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div 
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--gold))]/20 border border-[hsl(var(--gold))]/30 rounded-full text-[hsl(var(--gold))] text-sm font-medium mb-6"
            >
              <Crown className="w-4 h-4" />
              Acesso Premium
            </motion.div>
            
            <motion.h2 
              variants={fadeUpVariants}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-playfair"
            >
              Eleve sua
              <span className="block bg-gradient-to-r from-primary via-[hsl(var(--gold))] to-primary bg-clip-text text-transparent">
                Carreira Jurídica
              </span>
            </motion.h2>
            
            <motion.p 
              variants={fadeUpVariants}
              className="text-xl text-white/70 mb-12 leading-relaxed"
            >
              Acesso ilimitado a todas as funcionalidades. Estude, pesquise e 
              domine o Direito com as melhores ferramentas do mercado.
            </motion.p>
            
            <motion.div 
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/20 via-[hsl(var(--gold))]/20 to-primary/20 border border-primary/30 rounded-2xl"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-white font-medium">Cadastre-se acima para começar</span>
              <Sparkles className="w-5 h-5 text-[hsl(var(--gold))]" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

export default DesktopLandingSections;
