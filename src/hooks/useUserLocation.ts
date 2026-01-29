import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEstadoPorTelefone } from '@/lib/dddEstados';
import { toast } from 'sonner';

export type LocationLabel = 'casa' | 'universidade' | 'trabalho' | 'outro';

export interface UserLocation {
  id: string;
  label: LocationLabel;
  nome: string | null;
  cep: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export interface UserFavoritePlace {
  id: string;
  place_id: string;
  nome: string | null;
  endereco: string | null;
  tipo: string | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  telefone: string | null;
  website: string | null;
  sobre: string | null;
}

export function useUserLocation() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [favorites, setFavorites] = useState<UserFavoritePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEstado, setUserEstado] = useState<{ sigla: string; capital: string; lat: number; lng: number } | null>(null);

  // Buscar localizações salvas
  const fetchLocations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      // Cast label to LocationLabel type
      const typedData = (data || []).map(item => ({
        ...item,
        label: item.label as LocationLabel,
      }));
      setLocations(typedData);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
    }
  }, [user]);

  // Buscar favoritos
  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorite_places')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    }
  }, [user]);

  // Detectar estado pelo telefone
  const detectEstadoFromPhone = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('telefone')
        .eq('id', user.id)
        .single();

      if (error || !data?.telefone) return;

      const estado = getEstadoPorTelefone(data.telefone);
      if (estado) {
        setUserEstado({
          sigla: estado.sigla,
          capital: estado.capital,
          lat: estado.lat,
          lng: estado.lng,
        });
      }
    } catch (error) {
      console.error('Erro ao detectar estado:', error);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLocations(), fetchFavorites(), detectEstadoFromPhone()]);
      setLoading(false);
    };
    init();
  }, [fetchLocations, fetchFavorites, detectEstadoFromPhone]);

  // Salvar nova localização
  const saveLocation = async (location: Omit<UserLocation, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          ...location,
        }, {
          onConflict: 'user_id,label',
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      toast.success('Localização salva!');
      return data;
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      toast.error('Erro ao salvar localização');
      return null;
    }
  };

  // Definir localização padrão
  const setDefaultLocation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchLocations();
      toast.success('Localização padrão atualizada!');
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
      toast.error('Erro ao atualizar localização padrão');
    }
  };

  // Remover localização
  const removeLocation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchLocations();
      toast.success('Localização removida!');
    } catch (error) {
      console.error('Erro ao remover localização:', error);
      toast.error('Erro ao remover localização');
    }
  };

  // Adicionar favorito
  const addFavorite = async (place: Omit<UserFavoritePlace, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_favorite_places')
        .upsert({
          user_id: user.id,
          ...place,
        }, {
          onConflict: 'user_id,place_id',
        })
        .select()
        .single();

      if (error) throw error;

      await fetchFavorites();
      toast.success('Adicionado aos favoritos!');
      return data;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      toast.error('Erro ao adicionar favorito');
      return null;
    }
  };

  // Remover favorito
  const removeFavorite = async (placeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorite_places')
        .delete()
        .eq('place_id', placeId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchFavorites();
      toast.success('Removido dos favoritos!');
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover favorito');
    }
  };

  // Verificar se é favorito
  const isFavorite = (placeId: string) => {
    return favorites.some(f => f.place_id === placeId);
  };

  // Obter localização padrão
  const getDefaultLocation = () => {
    return locations.find(l => l.is_default) || locations[0] || null;
  };

  return {
    locations,
    favorites,
    loading,
    userEstado,
    saveLocation,
    setDefaultLocation,
    removeLocation,
    addFavorite,
    removeFavorite,
    isFavorite,
    getDefaultLocation,
    refetch: () => Promise.all([fetchLocations(), fetchFavorites()]),
  };
}
