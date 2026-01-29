import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Lightbulb, TrendingUp, Bookmark, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import TCCEmAltaCarousel from "@/components/tcc/TCCEmAltaCarousel";
import TCCAreaChips from "@/components/tcc/TCCAreaChips";
import TCCMenuCard from "@/components/tcc/TCCMenuCard";

const TCCHub = () => {
  const navigate = useNavigate();

  // Esconder menu de rodapé
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]');
    if (bottomNav) {
      (bottomNav as HTMLElement).style.display = 'none';
    }
    return () => {
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Assistente de TCC
            </h1>
            <p className="text-sm text-muted-foreground">
              Pesquise, explore temas e receba sugestões personalizadas
            </p>
          </div>
        </div>

        {/* Carrossel Em Alta */}
        <TCCEmAltaCarousel />

        {/* Menu Principal */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Menu Principal</h2>
          <div className="grid grid-cols-2 gap-3">
            <TCCMenuCard
              icon={Search}
              title="Buscar TCC"
              description="Pesquise em BDTD e OASIS BR"
              href="/ferramentas/tcc/buscar"
              color="bg-blue-500/5 hover:bg-blue-500/10"
              iconColor="bg-blue-500/20 text-blue-600"
            />
            <TCCMenuCard
              icon={Lightbulb}
              title="Sugestões"
              description="Temas para seu perfil e ano"
              href="/ferramentas/tcc/sugestoes"
              color="bg-yellow-500/5 hover:bg-yellow-500/10"
              iconColor="bg-yellow-500/20 text-yellow-600"
            />
            <TCCMenuCard
              icon={TrendingUp}
              title="Tendências"
              description="Temas atuais e oportunidades"
              href="/ferramentas/tcc/tendencias"
              color="bg-green-500/5 hover:bg-green-500/10"
              iconColor="bg-green-500/20 text-green-600"
            />
            <TCCMenuCard
              icon={Bookmark}
              title="Meus TCCs"
              description="Salvos e analisados"
              href="/ferramentas/tcc/salvos"
              color="bg-purple-500/5 hover:bg-purple-500/10"
              iconColor="bg-purple-500/20 text-purple-600"
            />
          </div>
        </div>

        {/* Áreas do Direito */}
        <TCCAreaChips />

        {/* Quick Actions */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Acesso Rápido</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate("/ferramentas/tcc/buscar")}
            >
              <Search className="h-4 w-4 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Buscar trabalhos acadêmicos</p>
                <p className="text-xs text-muted-foreground">Dissertações, teses e TCCs em todo Brasil</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate("/ferramentas/tcc/sugestoes")}
            >
              <Lightbulb className="h-4 w-4 mr-3 text-yellow-500" />
              <div className="text-left">
                <p className="font-medium text-sm">Preciso de uma ideia para TCC</p>
                <p className="text-xs text-muted-foreground">A IA sugere temas com base no seu perfil</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCCHub;
