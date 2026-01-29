import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, MapPin, Phone, Clock, Star, Globe, Navigation, 
  ChevronLeft, ChevronRight, User, Accessibility, Car, CreditCard,
  Loader2, ExternalLink, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { abrirGoogleMaps } from "@/lib/mapUtils";
import { CompartilharLocalModal } from "@/components/ferramentas/CompartilharLocalModal";

interface Review {
  autor: string;
  autorFoto?: string;
  autorUrl?: string;
  rating: number;
  texto: string;
  tempoRelativo: string;
  dataPublicacao: string;
}

interface Foto {
  url: string;
  autor?: string;
}

interface LocalDetalhes {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  horarioFuncionamento?: string[];
  aberto: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  googleMapsUrl: string;
  fotos: Foto[];
  sobre?: string;
  website?: string;
  reviews: Review[];
  precoNivel?: number;
  acessibilidade?: {
    entradaAcessivel?: boolean;
    estacionamentoAcessivel?: boolean;
    banheiroAcessivel?: boolean;
  };
  estacionamento?: {
    pago?: boolean;
    gratuito?: boolean;
    rua?: boolean;
    garagem?: boolean;
    manobrista?: boolean;
  };
  tiposPagamento?: string[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-500 fill-yellow-500'
              : star - 0.5 <= rating
              ? 'text-yellow-500 fill-yellow-500/50'
              : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

// Tradução de dias da semana e termos para português
const traduzirDiaSemana = (horario: string): string => {
  const traducoes: Record<string, string> = {
    'Monday': 'Segunda-feira',
    'Tuesday': 'Terça-feira',
    'Wednesday': 'Quarta-feira',
    'Thursday': 'Quinta-feira',
    'Friday': 'Sexta-feira',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo',
    'Closed': 'Fechado',
    'Brazil': 'Brasil',
  };
  
  let resultado = horario;
  Object.entries(traducoes).forEach(([en, pt]) => {
    resultado = resultado.replace(new RegExp(en, 'gi'), pt);
  });
  return resultado;
};

// Traduzir endereço para português
const traduzirEndereco = (endereco: string): string => {
  return endereco.replace(/Brazil/gi, 'Brasil');
};

export default function LocalJuridicoDetalhes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { placeId } = useParams<{ placeId: string }>();
  
  const [local, setLocal] = useState<LocalDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [showCompartilharModal, setShowCompartilharModal] = useState(false);

  // Dados básicos passados via state (para carregamento rápido)
  const localBasico = location.state?.local;

  useEffect(() => {
    const buscarDetalhes = async () => {
      const idParaBuscar = placeId || localBasico?.id;
      
      if (!idParaBuscar) {
        toast.error('Local não encontrado');
        navigate('/ferramentas/locais-juridicos');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('local-juridico-detalhes', {
          body: { placeId: idParaBuscar }
        });

        if (error) throw error;

        if (data.local) {
          setLocal(data.local);
        } else {
          toast.error('Detalhes não encontrados');
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        toast.error('Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    };

    buscarDetalhes();
  }, [placeId, localBasico?.id, navigate]);

  const proximaFoto = () => {
    if (local?.fotos) {
      setFotoAtual((prev) => (prev + 1) % local.fotos.length);
    }
  };

  const fotoAnterior = () => {
    if (local?.fotos) {
      setFotoAtual((prev) => (prev - 1 + local.fotos.length) % local.fotos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Local não encontrado</p>
          <Button onClick={() => navigate('/ferramentas/locais-juridicos')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{local.nome}</h1>
            <p className="text-xs text-muted-foreground truncate">{traduzirEndereco(local.endereco)}</p>
          </div>
        </div>
      </div>

      {/* Galeria de Fotos */}
      {local.fotos.length > 0 && (
        <div className="relative aspect-video bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={fotoAtual}
              src={local.fotos[fotoAtual]?.url}
              alt={`Foto ${fotoAtual + 1} de ${local.nome}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {local.fotos.length > 1 && (
            <>
              <button
                onClick={fotoAnterior}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={proximaFoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicadores */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {local.fotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFotoAtual(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === fotoAtual ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Crédito da foto */}
          {local.fotos[fotoAtual]?.autor && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
              📷 {local.fotos[fotoAtual].autor}
            </div>
          )}
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{local.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  local.aberto 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {local.aberto ? '🟢 Aberto' : '🔴 Fechado'}
                </span>
              </div>
            </div>
          </div>

          {/* Endereço, Telefone, Website */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <span>{traduzirEndereco(local.endereco)}</span>
            </div>

            {local.telefone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-teal-500" />
                <a href={`tel:${local.telefone}`} className="text-teal-500 hover:underline">
                  {local.telefone}
                </a>
              </div>
            )}

            {local.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-5 h-5 text-teal-500" />
                <a 
                  href={local.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-teal-500 hover:underline flex items-center gap-1"
                >
                  {local.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Sobre */}
        {local.sobre && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Sobre</h3>
            <p className="text-sm text-muted-foreground">{local.sobre}</p>
          </div>
        )}

        {/* Horários de Funcionamento */}
        {local.horarioFuncionamento && local.horarioFuncionamento.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setMostrarHorarios(!mostrarHorarios)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-500" />
                <span className="font-medium">Horários de Funcionamento</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${mostrarHorarios ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {mostrarHorarios && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {local.horarioFuncionamento.map((horario, i) => (
                      <p key={i} className="text-sm text-muted-foreground pl-8">
                        {traduzirDiaSemana(horario)}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Acessibilidade */}
        {local.acessibilidade && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Accessibility className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Acessibilidade</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {local.acessibilidade.entradaAcessivel && (
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                  ♿ Entrada acessível
                </span>
              )}
              {local.acessibilidade.estacionamentoAcessivel && (
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                  🅿️ Estacionamento acessível
                </span>
              )}
              {local.acessibilidade.banheiroAcessivel && (
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                  🚻 Banheiro acessível
                </span>
              )}
            </div>
          </div>
        )}

        {/* Estacionamento */}
        {local.estacionamento && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Estacionamento</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {local.estacionamento.gratuito && (
                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                  Gratuito
                </span>
              )}
              {local.estacionamento.pago && (
                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                  Pago
                </span>
              )}
              {local.estacionamento.rua && (
                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                  Na rua
                </span>
              )}
              {local.estacionamento.garagem && (
                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                  Garagem
                </span>
              )}
              {local.estacionamento.manobrista && (
                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                  Manobrista
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formas de Pagamento */}
        {local.tiposPagamento && local.tiposPagamento.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span className="font-medium">Formas de Pagamento</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {local.tiposPagamento.map((tipo, i) => (
                <span key={i} className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">
                  {tipo}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews removido conforme solicitação */}

        {/* Botões de Ação */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="container mx-auto flex gap-3">
            <Button
              onClick={() => abrirGoogleMaps({ 
                latitude: local.latitude, 
                longitude: local.longitude, 
                nome: local.nome, 
                endereco: local.endereco 
              })}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Como Chegar
            </Button>
            
            <Button
              onClick={() => setShowCompartilharModal(true)}
              variant="outline"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            {local.telefone && (
              <Button
                onClick={() => window.open(`tel:${local.telefone}`, '_self')}
                variant="outline"
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      <CompartilharLocalModal
        isOpen={showCompartilharModal}
        onClose={() => setShowCompartilharModal(false)}
        local={{
          id: local.id,
          nome: local.nome,
          endereco: local.endereco,
          latitude: local.latitude,
          longitude: local.longitude,
          telefone: local.telefone,
          aberto: local.aberto,
          avaliacao: local.avaliacao,
          totalAvaliacoes: local.totalAvaliacoes,
          tipo: 'local',
          googleMapsUrl: local.googleMapsUrl,
        }}
      />
    </div>
  );
}
