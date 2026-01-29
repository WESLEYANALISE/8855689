import { useState } from 'react';
import { MapPin, Home, GraduationCap, Briefcase, MapPinPlus, Trash2, Star, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserLocation, LocationLabel } from '@/hooks/useUserLocation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const labelIcons: Record<LocationLabel, typeof Home> = {
  casa: Home,
  universidade: GraduationCap,
  trabalho: Briefcase,
  outro: MapPinPlus,
};

const labelLabels: Record<LocationLabel, string> = {
  casa: 'Casa',
  universidade: 'Universidade',
  trabalho: 'Trabalho',
  outro: 'Outro',
};

export function PerfilLocalizacaoTab() {
  const { 
    locations, 
    favorites, 
    loading, 
    saveLocation, 
    setDefaultLocation, 
    removeLocation,
    removeFavorite,
    refetch 
  } = useUserLocation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [cep, setCep] = useState('');
  const [labelSelecionado, setLabelSelecionado] = useState<LocationLabel>('casa');
  const [loadingAdd, setLoadingAdd] = useState(false);

  const handleAddLocation = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast.error('Digite um CEP válido');
      return;
    }

    setLoadingAdd(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-cep', {
        body: { cep },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

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

      setCep('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar localização:', error);
      toast.error('Erro ao adicionar localização');
    } finally {
      setLoadingAdd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meus Locais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-500" />
            <h3 className="font-semibold">Meus Locais</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Formulário para adicionar */}
        {showAddForm && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-4">
            <div>
              <Label htmlFor="cep-perfil">CEP</Label>
              <Input
                id="cep-perfil"
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
              />
            </div>

            <div>
              <Label>Tipo de local</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['casa', 'universidade', 'trabalho', 'outro'] as LocationLabel[]).map((label) => {
                  const Icon = labelIcons[label];
                  const isSelected = labelSelecionado === label;
                  const exists = locations.some(l => l.label === label);
                  
                  return (
                    <button
                      key={label}
                      onClick={() => setLabelSelecionado(label)}
                      disabled={exists}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        exists 
                          ? 'opacity-50 cursor-not-allowed border-border'
                          : isSelected
                            ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                            : 'border-border hover:border-teal-500/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{labelLabels[label]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddLocation}
                disabled={loadingAdd || cep.replace(/\D/g, '').length !== 8}
                className="flex-1"
              >
                {loadingAdd && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setCep('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de locais */}
        {locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum local salvo</p>
            <p className="text-xs">Adicione locais para facilitar suas buscas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => {
              const Icon = labelIcons[location.label];
              return (
                <div
                  key={location.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className={`p-2 rounded-full ${location.is_default ? 'bg-teal-500/20 text-teal-500' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{labelLabels[location.label]}</p>
                      {location.is_default && (
                        <span className="text-xs bg-teal-500/10 text-teal-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {location.cidade}, {location.estado} • CEP {location.cep}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {!location.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDefaultLocation(location.id)}
                        title="Definir como padrão"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocation(location.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lugares Favoritos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">Lugares Favoritos</h3>
          <span className="text-sm text-muted-foreground">({favorites.length})</span>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Star className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum favorito</p>
            <p className="text-xs">Favorite lugares no Localizador Jurídico</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                {fav.foto_url ? (
                  <img 
                    src={fav.foto_url} 
                    alt="" 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fav.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{fav.endereco}</p>
                  {fav.tipo && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                      {fav.tipo}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFavorite(fav.place_id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
