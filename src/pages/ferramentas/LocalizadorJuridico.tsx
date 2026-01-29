import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, Star, Building2, FileText, Scale, Briefcase, Loader2, RefreshCw, Heart, Globe, ChevronDown, ChevronUp, Home, GraduationCap, Briefcase as WorkIcon, MapPinPlus, Landmark, Info, List, Map, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { abrirGoogleMaps } from "@/lib/mapUtils";
import { useUserLocation, LocationLabel } from "@/hooks/useUserLocation";
import { useAuth } from "@/contexts/AuthContext";
import { MapaLocaisJuridicos } from "@/components/ferramentas/MapaLocaisJuridicos";
import { CompartilharLocalModal } from "@/components/ferramentas/CompartilharLocalModal";

// Importar imagens das categorias
import imgTribunais from "@/assets/categoria-tribunais.png";
import imgCartorios from "@/assets/categoria-cartorios.png";
import imgOab from "@/assets/categoria-oab.png";
import imgEscritorios from "@/assets/categoria-escritorios.png";
import imgMuseus from "@/assets/categoria-museus.png";
import imgTodos from "@/assets/categoria-todos.png";

interface LocalJuridico {
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
  distancia: number;
  tipo: string;
  googleMapsUrl: string;
  fotoUrl?: string;
  sobre?: string;
  website?: string;
}

type TipoFiltro = 'todos' | 'tribunal' | 'cartorio' | 'oab' | 'advocacia' | 'museu';

const tiposConfig: { id: TipoFiltro; label: string; icon: typeof Building2; cor: string; imagem: string }[] = [
  { id: 'tribunal', label: 'Tribunais', icon: Scale, cor: 'from-amber-400 to-amber-600', imagem: imgTribunais },
  { id: 'cartorio', label: 'Cartórios', icon: FileText, cor: 'from-orange-400 to-orange-600', imagem: imgCartorios },
  { id: 'oab', label: 'OAB', icon: Building2, cor: 'from-emerald-400 to-emerald-600', imagem: imgOab },
  { id: 'advocacia', label: 'Escritórios', icon: Briefcase, cor: 'from-purple-400 to-purple-600', imagem: imgEscritorios },
  { id: 'museu', label: 'Museus', icon: Landmark, cor: 'from-rose-400 to-rose-600', imagem: imgMuseus },
  { id: 'todos', label: 'Todos', icon: MapPin, cor: 'from-teal-400 to-teal-600', imagem: imgTodos },
];

const labelIcons: Record<LocationLabel, typeof Home> = {
  casa: Home,
  universidade: GraduationCap,
  trabalho: WorkIcon,
  outro: MapPinPlus,
};

const labelLabels: Record<LocationLabel, string> = {
  casa: 'Casa',
  universidade: 'Universidade',
  trabalho: 'Trabalho',
  outro: 'Outro',
};

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

export default function LocalizadorJuridico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    locations, 
    favorites, 
    loading: loadingLocations, 
    userEstado, 
    saveLocation, 
    addFavorite, 
    removeFavorite, 
    isFavorite,
    getDefaultLocation 
  } = useUserLocation();

  const [locais, setLocais] = useState<LocalJuridico[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoFiltro | null>(null);
  const [raio, setRaio] = useState(10);
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number; nome: string; cidade?: string } | null>(null);
  const [horarioExpandido, setHorarioExpandido] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [localParaCompartilhar, setLocalParaCompartilhar] = useState<LocalJuridico | null>(null);
  const [showCompartilharModal, setShowCompartilharModal] = useState(false);
  
  // Setup inicial - CEP
  const [mostrarSetup, setMostrarSetup] = useState(false);
  const [cep, setCep] = useState('');
  const [labelSelecionado, setLabelSelecionado] = useState<LocationLabel>('casa');
  const [loadingCep, setLoadingCep] = useState(false);

  // Inicialização
  useEffect(() => {
    if (!loadingLocations) {
      const defaultLoc = getDefaultLocation();
      if (defaultLoc && defaultLoc.latitude && defaultLoc.longitude) {
        setLocalizacao({
          lat: defaultLoc.latitude,
          lng: defaultLoc.longitude,
          nome: `${labelLabels[defaultLoc.label]} - ${defaultLoc.cidade || defaultLoc.endereco}`,
          cidade: defaultLoc.cidade || undefined,
        });
      } else if (locations.length === 0 && user) {
        // Usuário logado sem localizações - mostrar setup
        setMostrarSetup(true);
      } else if (!user && userEstado) {
        // Usuário não logado - usar estado detectado
        setLocalizacao({
          lat: userEstado.lat,
          lng: userEstado.lng,
          nome: `${userEstado.capital}, ${userEstado.sigla}`,
          cidade: userEstado.capital,
        });
      }
    }
  }, [loadingLocations, locations, user, userEstado]);

  const buscarPorCep = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast.error('Digite um CEP válido com 8 dígitos');
      return;
    }

    setLoadingCep(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-cep', {
        body: { cep },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Salvar localização se usuário logado
      if (user) {
        await saveLocation({
          label: labelSelecionado,
          nome: labelLabels[labelSelecionado],
          cep: data.cep,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          latitude: data.latitude,
          longitude: data.longitude,
          is_default: locations.length === 0,
        });
      }

      setLocalizacao({
        lat: data.latitude,
        lng: data.longitude,
        nome: `${labelLabels[labelSelecionado]} - ${data.cidade}, ${data.estado}`,
        cidade: data.cidade,
      });

      setMostrarSetup(false);
      toast.success(`Localização configurada: ${data.cidade}, ${data.estado}`);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const buscarLocais = async (lat: number, lng: number, tipo: TipoFiltro, raioMetros: number, cidade?: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('buscar-locais-juridicos', {
        body: {
          latitude: lat,
          longitude: lng,
          tipo,
          raio: raioMetros,
          cidade,
        },
      });

      if (error) throw error;

      setLocais(data.locais || []);
      
      if (data.locais?.length === 0) {
        toast.info("Nenhum local encontrado nesta área");
      } else {
        // Toast removido conforme solicitação
      }
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      toast.error("Erro ao buscar locais jurídicos");
    } finally {
      setLoading(false);
    }
  };

  const handleTipoSelect = (tipo: TipoFiltro) => {
    setTipoSelecionado(tipo);
    if (localizacao) {
      buscarLocais(localizacao.lat, localizacao.lng, tipo, raio * 1000, localizacao.cidade);
    }
  };

  const handleFavorite = async (local: LocalJuridico) => {
    if (!user) {
      toast.error('Faça login para salvar favoritos');
      return;
    }

    if (isFavorite(local.id)) {
      await removeFavorite(local.id);
    } else {
      await addFavorite({
        place_id: local.id,
        nome: local.nome,
        endereco: local.endereco,
        tipo: local.tipo,
        foto_url: local.fotoUrl || null,
        latitude: local.latitude,
        longitude: local.longitude,
        telefone: local.telefone || null,
        website: local.website || null,
        sobre: local.sobre || null,
      });
    }
  };

  const aplicarRaio = () => {
    if (localizacao && tipoSelecionado) {
      buscarLocais(localizacao.lat, localizacao.lng, tipoSelecionado, raio * 1000, localizacao.cidade);
    }
  };

  const getTipoIcon = (tipo: string) => {
    const config = tiposConfig.find(t => t.id === tipo);
    return config?.icon || MapPin;
  };

  const getTipoBadge = (tipo: string) => {
    const config = tiposConfig.find(t => t.id === tipo);
    return config?.label || 'Local';
  };

  const locaisFiltrados = tipoSelecionado === 'todos' 
    ? locais 
    : locais.filter(l => l.tipo === tipoSelecionado);

  // Loading inicial
  if (loadingLocations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header compacto */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
            <MapPin className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h1 className="font-semibold">Localizador Jurídico</h1>
            <p className="text-xs text-muted-foreground">Encontre tribunais, cartórios, OAB e museus</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Setup de Localização (CEP) */}
        {mostrarSetup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold">Configure sua localização</h3>
              {userEstado && (
                <p className="text-sm text-muted-foreground">
                  Detectamos que você é de <span className="text-teal-500 font-medium">{userEstado.capital}, {userEstado.sigla}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cep">Seu CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 5) {
                      value = value.slice(0, 5) + '-' + value.slice(5, 8);
                    }
                    setCep(value);
                  }}
                  maxLength={9}
                  className="text-center text-lg font-mono"
                />
              </div>

              <div>
                <Label>Este local é:</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['casa', 'universidade', 'trabalho', 'outro'] as LocationLabel[]).map((label) => {
                    const Icon = labelIcons[label];
                    const isSelected = labelSelecionado === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setLabelSelecionado(label)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                            : 'border-border hover:border-teal-500/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{labelLabels[label]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={buscarPorCep}
                disabled={loadingCep || cep.replace(/\D/g, '').length !== 8}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                {loadingCep ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                Confirmar Localização
              </Button>

              <button 
                onClick={() => setMostrarSetup(false)}
                className="text-sm text-muted-foreground hover:text-teal-500 underline w-full text-center"
              >
                Pular por agora
              </button>
            </div>
          </motion.div>
        )}

        {/* Localização Ativa */}
        {localizacao && !mostrarSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-teal-500/20">
                <MapPin className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{localizacao.nome}</p>
                <p className="text-xs text-muted-foreground">Buscando em um raio de {raio} km</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarSetup(true)}
              className="text-teal-500 hover:text-teal-400"
            >
              Alterar
            </Button>
          </motion.div>
        )}

        {/* Seleção de Categoria */}
        {localizacao && !mostrarSetup && !tipoSelecionado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-center">O que você procura?</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {tiposConfig.map((tipo, index) => (
                <motion.button
                  key={tipo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTipoSelect(tipo.id)}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* Imagem de fundo */}
                  <img 
                    src={tipo.imagem} 
                    alt={tipo.label}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Overlay gradiente */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${tipo.cor} opacity-70 group-hover:opacity-80 transition-opacity`} />
                  
                  {/* Conteúdo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <span className="font-bold text-lg drop-shadow-lg">{tipo.label}</span>
                  </div>
                  
                  {/* Brilho no hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* Favoritos */}
            {favorites.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="font-medium">Meus Favoritos ({favorites.length})</span>
                </div>
                <div className="space-y-2">
                  {favorites.slice(0, 3).map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => fav.latitude && fav.longitude && abrirGoogleMaps({ latitude: fav.latitude, longitude: fav.longitude, nome: fav.nome || undefined })}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-rose-500/50 transition-all text-left"
                    >
                      {fav.foto_url ? (
                        <img src={fav.foto_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fav.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{fav.endereco}</p>
                      </div>
                      <Navigation className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Resultados - Sem filtros extras, mostra só a categoria selecionada */}
        {tipoSelecionado && localizacao && !mostrarSetup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header da categoria selecionada */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const tipoAtual = tiposConfig.find(t => t.id === tipoSelecionado);
                  if (!tipoAtual) return null;
                  return (
                    <>
                      <img src={tipoAtual.imagem} alt={tipoAtual.label} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold">{tipoAtual.label}</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle Lista/Mapa */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setVisualizacao('lista')}
                    className={`p-2 rounded-md transition-colors ${
                      visualizacao === 'lista' 
                        ? 'bg-background text-teal-500 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVisualizacao('mapa')}
                    className={`p-2 rounded-md transition-colors ${
                      visualizacao === 'mapa' 
                        ? 'bg-background text-teal-500 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setTipoSelecionado(null);
                    setLocais([]);
                  }}
                  className="text-sm text-teal-500 hover:text-teal-400 font-medium"
                >
                  ← Trocar
                </button>
              </div>
            </div>

            {/* Controle de Raio */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Raio de busca</span>
                <span className="text-sm font-medium text-teal-500">{raio} km</span>
              </div>
              
              <Slider
                value={[raio]}
                onValueChange={(v) => setRaio(v[0])}
                onValueCommit={aplicarRaio}
                min={5}
                max={200}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 km</span>
                <span>200 km</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mapa Interativo */}
        {visualizacao === 'mapa' && localizacao && locaisFiltrados.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MapaLocaisJuridicos
              locais={locaisFiltrados}
              centro={{ lat: localizacao.lat, lng: localizacao.lng }}
              onLocalClick={(local) => navigate(`/ferramentas/locais-juridicos/${local.id}`, { state: { local } })}
            />
          </motion.div>
        )}

        {/* Lista de Resultados */}
        <AnimatePresence mode="popLayout">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-muted-foreground">Buscando locais...</p>
            </motion.div>
          )}

          {!loading && visualizacao === 'lista' && locaisFiltrados.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {locaisFiltrados.length} local{locaisFiltrados.length > 1 ? 'is' : ''} encontrado{locaisFiltrados.length > 1 ? 's' : ''}
              </p>

              {locaisFiltrados.map((local, index) => {
                const Icon = getTipoIcon(local.tipo);
                const isExpanded = horarioExpandido === local.id;
                const favorito = isFavorite(local.id);

                return (
                  <motion.div
                    key={local.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    {/* Header com foto */}
                    <div className="flex gap-4 p-4">
                      {local.fotoUrl ? (
                        <img 
                          src={local.fotoUrl} 
                          alt={local.nome}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground line-clamp-2">{local.nome}</h3>
                          <button
                            onClick={() => handleFavorite(local)}
                            className={`p-1.5 rounded-full transition-colors ${
                              favorito ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${favorito ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                            {getTipoBadge(local.tipo)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            📍 {local.distancia} km
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
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

                    {/* Informações */}
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{traduzirEndereco(local.endereco)}</span>
                      </p>

                      {local.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${local.telefone}`} className="text-teal-500 hover:underline">
                            {local.telefone}
                          </a>
                        </p>
                      )}

                      {local.website && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={local.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-teal-500 hover:underline truncate"
                          >
                            {local.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                          </a>
                        </p>
                      )}

                      {local.sobre && (
                        <div className="bg-muted/50 rounded-lg p-3 mt-2">
                          <p className="text-sm text-muted-foreground italic">"{local.sobre}"</p>
                        </div>
                      )}

                      {/* Horários expandíveis */}
                      {local.horarioFuncionamento && local.horarioFuncionamento.length > 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => setHorarioExpandido(isExpanded ? null : local.id)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Horários de funcionamento</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 pl-6 space-y-1">
                                  {local.horarioFuncionamento.map((horario, i) => (
                                    <p key={i} className="text-xs text-muted-foreground">
                                      {traduzirDiaSemana(horario)}
                                    </p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="border-t border-border p-3 flex gap-2">
                      <Button
                        onClick={() => abrirGoogleMaps({ latitude: local.latitude, longitude: local.longitude, nome: local.nome, endereco: local.endereco })}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Ir
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalParaCompartilhar(local);
                          setShowCompartilharModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => navigate(`/ferramentas/locais-juridicos/${local.id}`, { state: { local } })}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                      >
                        <Info className="w-4 h-4 mr-1" />
                        Ver Mais
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && tipoSelecionado && locaisFiltrados.length === 0 && locais.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground">Nenhum resultado para este filtro</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Compartilhamento */}
      {localParaCompartilhar && (
        <CompartilharLocalModal
          isOpen={showCompartilharModal}
          onClose={() => {
            setShowCompartilharModal(false);
            setLocalParaCompartilhar(null);
          }}
          local={localParaCompartilhar}
        />
      )}
    </div>
  );
}
