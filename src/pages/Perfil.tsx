import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Briefcase, GraduationCap, FileText, Loader2, LogOut, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/PhoneInput';
import { PerfilPlanoTab } from '@/components/perfil/PerfilPlanoTab';
import { PerfilSuporteTab } from '@/components/perfil/PerfilSuporteTab';
import { PerfilLocalizacaoTab } from '@/components/perfil/PerfilLocalizacaoTab';

type Intencao = 'estudante' | 'oab';

interface ProfileData {
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
  intencao: Intencao | null;
}

const intencaoOptions: { value: Intencao; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'estudante', 
    label: 'Estudos', 
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Quero estudar Direito e acessar todo o conteúdo'
  },
  { 
    value: 'oab', 
    label: 'OAB', 
    icon: <FileText className="h-5 w-5" />,
    description: 'Quero estudar para 1ª e 2ª Fase da OAB'
  },
];

export default function Perfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nome: '',
    telefone: '',
    avatar_url: null,
    intencao: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, telefone, avatar_url, intencao')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }

      if (data) {
        setProfile({
          nome: data.nome || user.email?.split('@')[0] || '',
          telefone: data.telefone || '',
          avatar_url: data.avatar_url,
          intencao: data.intencao as Intencao | null,
        });
      } else {
        setProfile(prev => ({
          ...prev,
          nome: user.email?.split('@')[0] || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload original image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-original.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL of uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Convert to WebP using edge function
      const response = await supabase.functions.invoke('otimizar-imagem', {
        body: {
          imageUrl: publicUrl,
          preset: 'logo-md', // 128x128
        },
      });

      if (response.error) throw response.error;

      const webpUrl = response.data?.webpUrl || publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: webpUrl,
        });

      if (updateError) throw updateError;

      // Sincronizar com Auth Users (para aparecer no Supabase Dashboard)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: webpUrl,
          picture: webpUrl  // Compatibilidade com formato OAuth
        }
      });

      if (authError) {
        console.warn('Não foi possível sincronizar avatar com Auth:', authError);
      }

      setProfile(prev => ({ ...prev, avatar_url: webpUrl }));

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: 'Não foi possível atualizar sua foto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      // Salvar na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nome: profile.nome,
          telefone: profile.telefone,
          intencao: profile.intencao,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;

      // Atualizar telefone na tabela auth.users (se telefone foi preenchido)
      if (profile.telefone) {
        const { error: authError } = await supabase.auth.updateUser({
          phone: profile.telefone,
        });
        
        if (authError) {
          console.warn('Aviso: Não foi possível atualizar telefone na autenticação:', authError.message);
        }
      }

      toast({
        title: 'Perfil salvo!',
        description: 'Suas alterações foram salvas com sucesso.',
      });

      // Voltar para a página anterior após salvar
      navigate(-1);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure suas informações</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="localizacao">Local</TabsTrigger>
            <TabsTrigger value="plano">Plano</TabsTrigger>
            <TabsTrigger value="suporte">Suporte</TabsTrigger>
          </TabsList>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-muted border-4 border-background shadow-xl overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Toque no ícone para alterar a foto
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={profile.nome || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome"
                className="h-12"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <PhoneInput
                value={profile.telefone || ''}
                onChange={(_, fullNumber) => setProfile(prev => ({ ...prev, telefone: fullNumber }))}
                placeholder="(11) 99999-9999"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Este número será usado para acessar a Evelyn no WhatsApp
              </p>
            </div>

            {/* Intention Selection - Dropdown */}
            <div className="space-y-3">
              <Label>Qual é o seu objetivo?</Label>
              <Select
                value={profile.intencao || undefined}
                onValueChange={(value) => setProfile(prev => ({ ...prev, intencao: value as Intencao }))}
              >
                <SelectTrigger className="h-auto p-4">
                  <SelectValue placeholder="Selecione seu objetivo">
                    {profile.intencao && (() => {
                      const selected = intencaoOptions.find(o => o.value === profile.intencao);
                      return selected ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary text-primary-foreground">
                            {selected.icon}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{selected.label}</p>
                            <p className="text-xs text-muted-foreground">{selected.description}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {intencaoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {option.icon}
                        </div>
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>

            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await supabase.auth.signOut({ scope: 'local' });
                } catch (error) {
                  console.error('Erro ao sair:', error);
                }
                navigate('/auth', { replace: true });
              }}
              className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </TabsContent>

          {/* Localização Tab */}
          <TabsContent value="localizacao">
            <PerfilLocalizacaoTab />
          </TabsContent>

          {/* Plano Tab */}
          <TabsContent value="plano">
            <PerfilPlanoTab />
          </TabsContent>

          {/* Suporte Tab */}
          <TabsContent value="suporte">
            <PerfilSuporteTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
