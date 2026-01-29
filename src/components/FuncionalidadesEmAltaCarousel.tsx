import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";

// Importar as capas
import introBlogger from "@/assets/intro-blogger-juridico-new.png";
import introCursos from "@/assets/intro-iniciando-direito-new.png";
import introQuestoes from "@/assets/intro-questoes-new.png";
import introFlashcards from "@/assets/intro-flashcards-new.png";
import introResumos from "@/assets/intro-resumos-new.png";
import introMapaMental from "@/assets/intro-mapa-mental-new.png";
import introPlanoEstudos from "@/assets/intro-plano-estudos-new.png";
import introVideoaulas from "@/assets/intro-videoaulas-new.png";

const itensEmAlta = [
  {
    id: "evelyn-whatsapp",
    titulo: "Evelyn WhatsApp",
    subtitulo: "Assistente jurídica 24h",
    imagemCapa: introBlogger,
    textoBotao: "Acessar",
    route: "/evelyn"
  },
  {
    id: "blogger-juridico",
    titulo: "Blogger Jurídico",
    subtitulo: "Guia para iniciantes",
    imagemCapa: introBlogger,
    textoBotao: "Acessar",
    route: "/blogger-juridico/artigos"
  },
  {
    id: "cursos",
    titulo: "Iniciando o Direito",
    subtitulo: "Sua jornada começa aqui",
    imagemCapa: introCursos,
    textoBotao: "Começar",
    route: "/iniciando-direito/todos"
  },
  {
    id: "questoes",
    titulo: "Questões",
    subtitulo: "Concursos e OAB",
    imagemCapa: introQuestoes,
    textoBotao: "Resolver",
    route: "/ferramentas/questoes"
  },
  {
    id: "flashcards",
    titulo: "Flashcards",
    subtitulo: "Memorização eficiente",
    imagemCapa: introFlashcards,
    textoBotao: "Estudar",
    route: "/flashcards/areas"
  },
  {
    id: "resumos",
    titulo: "Resumos Jurídicos",
    subtitulo: "Conteúdo objetivo",
    imagemCapa: introResumos,
    textoBotao: "Ver",
    route: "/resumos-juridicos"
  },
  {
    id: "mapa-mental",
    titulo: "Mapa Mental",
    subtitulo: "Conecte conceitos",
    imagemCapa: introMapaMental,
    textoBotao: "Explorar",
    route: "/mapa-mental/temas"
  },
  {
    id: "plano-estudos",
    titulo: "Plano de Estudos",
    subtitulo: "Organize sua preparação",
    imagemCapa: introPlanoEstudos,
    textoBotao: "Criar",
    route: "/plano-estudos"
  },
  {
    id: "videoaulas",
    titulo: "Videoaulas",
    subtitulo: "Aulas em vídeo",
    imagemCapa: introVideoaulas,
    textoBotao: "Assistir",
    route: "/videoaulas/playlists"
  },
];

export const FuncionalidadesEmAltaCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {itensEmAlta.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-[75%] max-w-[280px]"
          >
            <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border h-full">
              {/* Imagem de Capa */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={item.imagemCapa}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Título sobre a imagem */}
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="text-base font-bold text-white drop-shadow-lg leading-tight">
                    {item.titulo}
                  </h3>
                  <p className="text-white/80 text-xs">{item.subtitulo}</p>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="p-3">
                <Button
                  onClick={() => navigate(item.route)}
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md"
                >
                  {item.textoBotao}
                  <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
