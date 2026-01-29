import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Bell, Check, Loader2, Sparkles, Scale, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const areasDisponiveis = [
  { id: 'constitucional', label: 'Direito Constitucional' },
  { id: 'civil', label: 'Direito Civil' },
  { id: 'penal', label: 'Direito Penal' },
  { id: 'trabalho', label: 'Direito do Trabalho' },
  { id: 'tributario', label: 'Direito Tributário' },
  { id: 'administrativo', label: 'Direito Administrativo' },
  { id: 'empresarial', label: 'Direito Empresarial' },
  { id: 'ambiental', label: 'Direito Ambiental' },
];

export default function VadeMecumPushLegislacao() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [frequencia, setFrequencia] = useState('diario');
  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inscrito, setInscrito] = useState(false);

  const toggleArea = (areaId: string) => {
    setAreasSelecionadas(prev => 
      prev.includes(areaId) 
        ? prev.filter(a => a !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      // Gerar token de confirmação
      const token = crypto.randomUUID();

      const { error } = await supabase
        .from('push_legislacao_inscritos' as any)
        .insert({
          email: email.toLowerCase().trim(),
          nome: nome.trim() || null,
          frequencia,
          areas_interesse: areasSelecionadas,
          token_confirmacao: token,
          ativo: true,
          confirmado: false
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este e-mail já está inscrito');
        } else {
          throw error;
        }
        return;
      }

      setInscrito(true);
      toast.success('Inscrição realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      toast.error('Erro ao realizar inscrição');
    } finally {
      setLoading(false);
    }
  };

  if (inscrito) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Inscrição Confirmada!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Você receberá atualizações legislativas no e-mail <strong>{email}</strong>
            </p>
            <Button onClick={() => navigate('/vade-mecum')} className="w-full">
              Voltar ao Vade Mecum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vade-mecum')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Push de Legislação
              </h1>
              <p className="text-sm text-muted-foreground">
                Receba novas leis por e-mail
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Card Explicativo */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 rounded-full p-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Como funciona?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    Novas leis publicadas no DOU
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Resumo diário ou semanal
                  </li>
                  <li className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" />
                    Direto no seu e-mail
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Nome (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome (opcional)</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              {/* Frequência */}
              <div className="space-y-3">
                <Label>Frequência</Label>
                <RadioGroup value={frequencia} onValueChange={setFrequencia}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="diario" id="diario" />
                    <Label htmlFor="diario" className="font-normal cursor-pointer">
                      Diário (todo dia às 18h)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semanal" id="semanal" />
                    <Label htmlFor="semanal" className="font-normal cursor-pointer">
                      Semanal (segunda-feira)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Áreas de Interesse */}
              <div className="space-y-3">
                <Label>Áreas de Interesse (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para receber todas as áreas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {areasDisponiveis.map((area) => (
                    <div 
                      key={area.id} 
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={area.id}
                        checked={areasSelecionadas.includes(area.id)}
                        onCheckedChange={() => toggleArea(area.id)}
                      />
                      <Label 
                        htmlFor={area.id} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {area.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Submit */}
              <Button 
                type="submit" 
                className="w-full h-12 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inscrevendo...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Inscrever-se
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Você pode cancelar a inscrição a qualquer momento clicando no link do e-mail.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
