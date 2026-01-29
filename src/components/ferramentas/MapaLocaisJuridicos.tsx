import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin } from 'lucide-react';

// Interface para o local jurídico
interface LocalJuridico {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  horarioFuncionamento?: string | string[];
  aberto?: boolean;
  tipo: string;
  websiteUri?: string;
  googleMapsUri?: string;
  fotoUrl?: string;
  googleMapsUrl?: string;
}

interface MapaLocaisJuridicosProps {
  locais: LocalJuridico[];
  centro: { lat: number; lng: number };
  onLocalClick: (local: LocalJuridico) => void;
}

// Cores por tipo de local
const coresPorTipo: Record<string, string> = {
  tribunal: '#F59E0B',
  cartorio: '#F97316',
  oab: '#10B981',
  advocacia: '#8B5CF6',
  museu: '#F43F5E',
  delegacia: '#7C3AED',
  defensoria: '#D97706',
  juizado: '#0891B2',
  forum: '#BE185D',
  'museu-juridico': '#6366F1',
  default: '#6B7280',
};

// Labels por tipo
const labelsPorTipo: Record<string, string> = {
  tribunal: 'Tribunais',
  cartorio: 'Cartórios',
  oab: 'OAB',
  advocacia: 'Escritórios',
  museu: 'Museus',
  delegacia: 'Delegacias',
  defensoria: 'Defensorias',
  juizado: 'Juizados',
  forum: 'Fóruns',
  'museu-juridico': 'Museus Jurídicos',
};

const containerStyle = {
  width: '100%',
  height: '100%',
};

export function MapaLocaisJuridicos({ locais, centro, onLocalClick }: MapaLocaisJuridicosProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState<LocalJuridico | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  // Buscar API key do Google Maps
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-token');
        if (error) throw error;
        if (data?.token) {
          setApiKey(data.token);
        }
      } catch (err) {
        console.error('Erro ao buscar token do Google Maps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
    
    // Ajustar bounds para mostrar todos os marcadores
    if (locais.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(centro.lat, centro.lng));
      locais.forEach(local => {
        bounds.extend(new google.maps.LatLng(local.latitude, local.longitude));
      });
      map.fitBounds(bounds, 50);
      
      // Limitar zoom máximo
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom && zoom > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [locais, centro]);

  // Atualizar bounds quando locais mudam
  useEffect(() => {
    if (mapRef && locais.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(centro.lat, centro.lng));
      locais.forEach(local => {
        bounds.extend(new google.maps.LatLng(local.latitude, local.longitude));
      });
      mapRef.fitBounds(bounds, 50);
    }
  }, [locais, mapRef, centro]);

  // Obter tipos únicos para legenda
  const tiposUnicos = [...new Set(locais.map((l) => l.tipo))];

  if (loading) {
    return (
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        <div className="text-center space-y-2">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Mapa não disponível</p>
          <p className="text-xs text-muted-foreground">Token do Google Maps não configurado</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Inicializando Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={centro}
        zoom={13}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {/* Marcador da localização do usuário ou centro */}
        <Marker
          position={userLocation || centro}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 10,
          }}
          title="Sua localização"
          zIndex={1000}
        />

        {/* Marcadores dos locais jurídicos */}
        {locais.map((local) => {
          const cor = coresPorTipo[local.tipo] || coresPorTipo.default;
          return (
            <Marker
              key={local.id}
              position={{ lat: local.latitude, lng: local.longitude }}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: cor,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 1.5,
                scale: 1.5,
                anchor: new google.maps.Point(12, 22),
              }}
              title={local.nome}
              onClick={() => setSelectedLocal(local)}
            />
          );
        })}

        {/* InfoWindow do local selecionado */}
        {selectedLocal && (
          <InfoWindow
            position={{ lat: selectedLocal.latitude, lng: selectedLocal.longitude }}
            onCloseClick={() => setSelectedLocal(null)}
            options={{ pixelOffset: new google.maps.Size(0, -30) }}
          >
            <div className="p-2 max-w-[250px]">
              {selectedLocal.fotoUrl && (
                <img 
                  src={selectedLocal.fotoUrl} 
                  alt={selectedLocal.nome}
                  className="w-full h-[100px] object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                {selectedLocal.nome}
              </h3>
              <p className="text-xs text-gray-600 mb-2">{selectedLocal.endereco}</p>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${coresPorTipo[selectedLocal.tipo] || coresPorTipo.default}20`,
                    color: coresPorTipo[selectedLocal.tipo] || coresPorTipo.default
                  }}
                >
                  {labelsPorTipo[selectedLocal.tipo] || 'Local'}
                </span>
              </div>
              <Button
                size="sm"
                className="w-full text-xs bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                onClick={() => {
                  onLocalClick(selectedLocal);
                  setSelectedLocal(null);
                }}
              >
                Ver Detalhes
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legenda */}
      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl p-3 border border-border">
        <p className="text-xs font-medium mb-2">Legenda</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {tiposUnicos.map((tipo) => (
            <div key={tipo} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: coresPorTipo[tipo] || coresPorTipo.default }}
              />
              <span className="text-xs text-muted-foreground">
                {labelsPorTipo[tipo] || tipo}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Você</span>
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <span className="text-sm font-medium">{locais.length} locais</span>
      </div>
    </div>
  );
}

export default MapaLocaisJuridicos;
