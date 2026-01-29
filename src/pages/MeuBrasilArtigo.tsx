import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WikipediaArtigo } from "@/components/WikipediaArtigo";

const MeuBrasilArtigo = () => {
  const { titulo } = useParams<{ titulo: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  if (!titulo) {
    return <div>Artigo não encontrado</div>;
  }

  // Detectar categoria a partir da URL
  const categoria = location.pathname.includes('/sistema/') 
    ? 'sistema' 
    : location.pathname.includes('/caso/') 
    ? 'caso'
    : location.pathname.includes('/instituicao/')
    ? 'instituicao'
    : location.pathname.includes('/jurista/')
    ? 'jurista'
    : 'artigo';

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <WikipediaArtigo titulo={decodeURIComponent(titulo)} categoria={categoria} />
    </div>
  );
};

export default MeuBrasilArtigo;
