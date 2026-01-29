import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Clock, DollarSign, Heart } from "lucide-react";
import { EstagioVaga } from "@/types/database.types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EstagioCardProps {
  vaga: EstagioVaga;
  isFavorited?: boolean;
  onFavoriteChange?: () => void;
}

export const EstagioCard = ({ vaga, isFavorited = false, onFavoriteChange }: EstagioCardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Faça login para favoritar vagas");
        setLoading(false);
        return;
      }

      if (isFavorited) {
        const { error } = await supabase
          .from('estagios_favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('vaga_id', vaga.id);

        if (error) throw error;
        toast.success("Vaga removida dos favoritos");
      } else {
        const { error } = await supabase
          .from('estagios_favoritos')
          .insert({ user_id: user.id, vaga_id: vaga.id });

        if (error) throw error;
        toast.success("Vaga adicionada aos favoritos");
      }

      onFavoriteChange?.();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error("Erro ao atualizar favoritos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => navigate(`/estagios/${vaga.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {vaga.titulo}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{vaga.empresa}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavorite}
          disabled={loading}
          className={isFavorited ? "text-red-500 hover:text-red-600" : ""}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {vaga.local && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{vaga.local}</span>
          </div>
        )}
        {vaga.remuneracao && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{vaga.remuneracao}</span>
          </div>
        )}
        {vaga.carga_horaria && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{vaga.carga_horaria}</span>
          </div>
        )}
      </div>

      {vaga.descricao && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {vaga.descricao}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {vaga.area_direito && (
          <Badge variant="secondary">{vaga.area_direito}</Badge>
        )}
        {vaga.tipo_vaga && (
          <Badge variant="outline">{vaga.tipo_vaga}</Badge>
        )}
      </div>
    </Card>
  );
}
