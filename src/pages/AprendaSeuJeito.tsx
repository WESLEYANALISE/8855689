import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Upload, BookOpen, FileText, Sparkles, 
  GraduationCap, Target, Brain, Settings2, Play,
  Scroll, Scale, Gavel, FileCode, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type FonteTipo = 'texto' | 'lei' | 'pdf';
type NivelType = 'iniciante' | 'intermediario' | 'avancado' | 'concurseiro';

interface AreaJuridica {
  id: string;
  nome: string;
  icone: React.ReactNode;
  temas: string[];
}

const areasJuridicas: AreaJuridica[] = [
  { id: 'constitucional', nome: 'Direito Constitucional', icone: <Scroll className="w-5 h-5" />, temas: ['Direitos Fundamentais', 'Organização do Estado', 'Controle de Constitucionalidade'] },
  { id: 'civil', nome: 'Direito Civil', icone: <Scale className="w-5 h-5" />, temas: ['Parte Geral', 'Obrigações', 'Contratos', 'Família', 'Sucessões'] },
  { id: 'penal', nome: 'Direito Penal', icone: <Gavel className="w-5 h-5" />, temas: ['Parte Geral', 'Crimes em Espécie', 'Execução Penal'] },
  { id: 'trabalho', nome: 'Direito do Trabalho', icone: <FileCode className="w-5 h-5" />, temas: ['CLT', 'Direito Coletivo', 'Processo do Trabalho'] },
  { id: 'administrativo', nome: 'Direito Administrativo', icone: <BookMarked className="w-5 h-5" />, temas: ['Atos Administrativos', 'Licitações', 'Servidores'] },
];

const niveis: { value: NivelType; label: string; descricao: string }[] = [
  { value: 'iniciante', label: 'Iniciante', descricao: 'Primeiros passos no Direito' },
  { value: 'intermediario', label: 'Intermediário', descricao: 'Já conhece os conceitos básicos' },
  { value: 'avancado', label: 'Avançado', descricao: 'Domínio técnico sólido' },
  { value: 'concurseiro', label: 'Concurseiro', descricao: 'Foco em provas e memorização' },
];

export default function AprendaSeuJeito() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<'fonte' | 'conteudo' | 'personalizacao' | 'gerando'>('fonte');
  const [fonteTipo, setFonteTipo] = useState<FonteTipo>('texto');
  const [conteudo, setConteudo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [nivel, setNivel] = useState<NivelType>('intermediario');
  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState(0);
  const [experienciaId, setExperienciaId] = useState<string | null>(null);

  const toggleArea = (areaId: string) => {
    setAreasSelecionadas(prev => 
      prev.includes(areaId) 
        ? prev.filter(a => a !== areaId)
        : [...prev, areaId]
    );
  };

  const handleGerarExperiencia = async () => {
    if (!conteudo.trim()) {
      toast.error('Insira o conteúdo para gerar a experiência');
      return;
    }

    if (!titulo.trim()) {
      toast.error('Dê um título para sua experiência');
      return;
    }

    setGerando(true);
    setEtapa('gerando');
    setProgressoGeracao(10);

    try {
      // Criar registro no banco
      const { data: expData, error: insertError } = await supabase
        .from('experiencias_aprendizado')
        .insert({
          titulo,
          fonte_tipo: fonteTipo,
          fonte_conteudo: conteudo,
          nivel,
          interesses: areasSelecionadas,
          status: 'pendente'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setExperienciaId(expData.id);
      setProgressoGeracao(30);

      // Chamar edge function para gerar
      const { data, error } = await supabase.functions.invoke('gerar-experiencia-aprendizado', {
        body: {
          experienciaId: expData.id,
          conteudo,
          titulo,
          nivel,
          formatos: ['texto', 'quiz', 'slides', 'audio', 'mapa']
        }
      });

      if (error) throw error;

      setProgressoGeracao(100);
      toast.success('Experiência gerada com sucesso!');
      
      // Navegar para a página de estudo
      setTimeout(() => {
        navigate(`/aprenda-seu-jeito/${expData.id}`);
      }, 1000);

    } catch (error) {
      console.error('Erro ao gerar experiência:', error);
      toast.error('Erro ao gerar experiência. Tente novamente.');
      setGerando(false);
      setEtapa('personalizacao');
    }
  };

  // Efeito de progresso animado durante geração
  useEffect(() => {
    if (gerando && progressoGeracao < 90) {
      const interval = setInterval(() => {
        setProgressoGeracao(prev => Math.min(prev + Math.random() * 10, 90));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gerando, progressoGeracao]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Aprenda do Seu Jeito
              </h1>
              <p className="text-sm text-muted-foreground">Estudo personalizado com IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['fonte', 'conteudo', 'personalizacao'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                etapa === step 
                  ? 'bg-primary text-primary-foreground scale-110' 
                  : i < ['fonte', 'conteudo', 'personalizacao'].indexOf(etapa)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  i < ['fonte', 'conteudo', 'personalizacao'].indexOf(etapa)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Etapa 1: Escolher Fonte */}
          {etapa === 'fonte' && (
            <motion.div
              key="fonte"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">De onde vem seu conteúdo?</h2>
                <p className="text-muted-foreground">Escolha a fonte do material que você quer estudar</p>
              </div>

              <div className="grid gap-4">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    fonteTipo === 'texto' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFonteTipo('texto')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Colar Texto</h3>
                      <p className="text-sm text-muted-foreground">Cole o conteúdo que você quer estudar</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      fonteTipo === 'texto' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {fonteTipo === 'texto' && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    fonteTipo === 'lei' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFonteTipo('lei')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Selecionar Lei/Código</h3>
                      <p className="text-sm text-muted-foreground">Escolha do Vade Mecum digital</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      fonteTipo === 'lei' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {fonteTipo === 'lei' && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg opacity-50 ${
                    fonteTipo === 'pdf' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toast.info('Upload de PDF em breve!')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Upload de PDF</h3>
                      <p className="text-sm text-muted-foreground">Envie seu material em PDF</p>
                      <Badge variant="secondary" className="mt-1">Em breve</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setEtapa('conteudo')}
              >
                Continuar
              </Button>
            </motion.div>
          )}

          {/* Etapa 2: Inserir Conteúdo */}
          {etapa === 'conteudo' && (
            <motion.div
              key="conteudo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {fonteTipo === 'texto' ? 'Cole seu conteúdo' : 'Selecione o conteúdo'}
                </h2>
                <p className="text-muted-foreground">
                  {fonteTipo === 'texto' 
                    ? 'Artigos de lei, doutrina, resumos...' 
                    : 'Escolha leis ou artigos do Vade Mecum'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título da Experiência</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Direitos Fundamentais - Art. 5º CF"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {fonteTipo === 'texto' && (
                  <div>
                    <Label htmlFor="conteudo">Conteúdo para Estudar</Label>
                    <Textarea
                      id="conteudo"
                      placeholder="Cole aqui o texto que você quer transformar em experiência de aprendizado..."
                      value={conteudo}
                      onChange={(e) => setConteudo(e.target.value)}
                      className="mt-1 min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {conteudo.length} caracteres
                    </p>
                  </div>
                )}

                {fonteTipo === 'lei' && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Seletor de leis em desenvolvimento</p>
                    <Button variant="outline" onClick={() => setFonteTipo('texto')}>
                      Usar texto por enquanto
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEtapa('fonte')}>
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={() => setEtapa('personalizacao')}
                  disabled={!conteudo.trim() || !titulo.trim()}
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Etapa 3: Personalização */}
          {etapa === 'personalizacao' && (
            <motion.div
              key="personalizacao"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Personalize sua experiência</h2>
                <p className="text-muted-foreground">A IA vai adaptar o conteúdo ao seu perfil</p>
              </div>

              {/* Nível */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <Label className="text-lg font-semibold">Seu nível de conhecimento</Label>
                </div>
                <RadioGroup value={nivel} onValueChange={(v) => setNivel(v as NivelType)}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {niveis.map((n) => (
                      <Label
                        key={n.value}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          nivel === n.value 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={n.value} />
                        <div>
                          <p className="font-medium">{n.label}</p>
                          <p className="text-xs text-muted-foreground">{n.descricao}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Áreas de interesse */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <Label className="text-lg font-semibold">Áreas de interesse (opcional)</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {areasJuridicas.map((area) => (
                    <Badge
                      key={area.id}
                      variant={areasSelecionadas.includes(area.id) ? 'default' : 'outline'}
                      className="cursor-pointer py-2 px-3 gap-2"
                      onClick={() => toggleArea(area.id)}
                    >
                      {area.icone}
                      {area.nome}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preview dos formatos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <Label className="text-lg font-semibold">Formatos que serão gerados</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { nome: 'Texto Imersivo', icone: '📖' },
                    { nome: 'Quizzes', icone: '🎯' },
                    { nome: 'Slides', icone: '🎬' },
                    { nome: 'Áudio-Aula', icone: '🎙️' },
                    { nome: 'Mapa Mental', icone: '🧠' },
                  ].map((formato) => (
                    <div 
                      key={formato.nome}
                      className="p-4 rounded-xl bg-muted/50 text-center"
                    >
                      <span className="text-2xl">{formato.icone}</span>
                      <p className="text-xs mt-1 font-medium">{formato.nome}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEtapa('conteudo')}>
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleGerarExperiencia}
                  disabled={gerando}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Experiência
                </Button>
              </div>
            </motion.div>
          )}

          {/* Etapa 4: Gerando */}
          {etapa === 'gerando' && (
            <motion.div
              key="gerando"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Criando sua experiência...</h2>
              <p className="text-muted-foreground mb-8">
                A IA está gerando 5 formatos de estudo personalizados para você
              </p>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressoGeracao}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {progressoGeracao < 30 && 'Analisando conteúdo...'}
                  {progressoGeracao >= 30 && progressoGeracao < 60 && 'Gerando texto imersivo e quizzes...'}
                  {progressoGeracao >= 60 && progressoGeracao < 90 && 'Criando slides e áudio-aula...'}
                  {progressoGeracao >= 90 && 'Finalizando mapa mental...'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-8">
                {['📖', '🎯', '🎬', '🎙️', '🧠'].map((emoji, i) => (
                  <motion.div
                    key={emoji}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: progressoGeracao > (i + 1) * 20 ? 1 : 0.3,
                      scale: progressoGeracao > (i + 1) * 20 ? 1.1 : 1
                    }}
                    className="text-3xl"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
