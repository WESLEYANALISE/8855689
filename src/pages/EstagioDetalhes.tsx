import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, DollarSign, Clock, ExternalLink, Heart, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EstagioVaga } from "@/types/database.types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EstagioDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vaga, setVaga] = useState<EstagioVaga | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVaga();
      checkFavorite();
    }
  }, [id]);

  const fetchVaga = async () => {
    try {
      const { data, error } = await supabase
        .from('estagios_vagas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVaga(data);
    } catch (error) {
      console.error('Erro ao buscar vaga:', error);
      toast.error("Erro ao carregar vaga");
      navigate('/estagios');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const { data } = await supabase
      .from('estagios_favoritos')
      .select('id')
      .eq('user_id', user.id)
      .eq('vaga_id', id)
      .single();

    setIsFavorited(!!data);
  };

  const handleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para favoritar vagas");
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from('estagios_favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('vaga_id', id);
        toast.success("Removido dos favoritos");
      } else {
        await supabase
          .from('estagios_favoritos')
          .insert({ user_id: user.id, vaga_id: id });
        toast.success("Adicionado aos favoritos");
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      toast.error("Erro ao atualizar favoritos");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!vaga) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/estagios')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{vaga.titulo}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Building2 className="w-5 h-5" />
                <span className="text-lg">{vaga.empresa}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleFavorite}>
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current text-red-500" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {vaga.local && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium">{vaga.local}</p>
                </div>
              </div>
            )}
            {vaga.remuneracao && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Remuneração</p>
                  <p className="font-medium">{vaga.remuneracao}</p>
                </div>
              </div>
            )}
            {vaga.carga_horaria && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Carga Horária</p>
                  <p className="font-medium">{vaga.carga_horaria}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {vaga.area_direito && <Badge>{vaga.area_direito}</Badge>}
            {vaga.tipo_vaga && <Badge variant="secondary">{vaga.tipo_vaga}</Badge>}
          </div>

          {vaga.descricao && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Descrição da Vaga</h2>
              <p className="text-muted-foreground whitespace-pre-line">{vaga.descricao}</p>
            </div>
          )}

          {vaga.requisitos && vaga.requisitos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Requisitos</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {vaga.requisitos.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {vaga.beneficios && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Benefícios</h2>
              <p className="text-muted-foreground">{vaga.beneficios}</p>
            </div>
          )}

          {vaga.link_candidatura && (
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="flex-1 gap-2"
                onClick={() => window.open(vaga.link_candidatura!, '_blank')}
              >
                <ExternalLink className="w-5 h-5" />
                Candidatar-se
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
