import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Scale, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from '@/components/PhoneInput';
import themisFull from '@/assets/themis-full.webp';
import themisFaceCloseup from '@/assets/themis-face-closeup.webp';
import { useHomePreloader } from '@/hooks/useHomePreloader';
import { useDeviceType } from '@/hooks/use-device-type';
import { preloadOnboardingVideo } from '@/hooks/useOnboardingVideoPreloader';
import DesktopLandingSections from '@/components/landing/DesktopLandingSections';
import logoDireitoPremium from '@/assets/logo-direito-premium.png';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const signupSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
    .max(100, { message: 'Nome muito longo' })
    .refine((val) => !val.includes('@'), {
      message: 'Este campo é para o seu nome, não para o e-mail. Digite seu nome completo.',
    }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
});

const resetSchema = z.object({
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const Auth: React.FC = () => {
  // Pré-carregar dados da Home em background enquanto usuário faz login
  useHomePreloader();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Detectar modo de recuperação de senha SINCRONAMENTE na inicialização
  const isRecoveryFromUrl = searchParams.get('type') === 'recovery';
  const [mode, setMode] = useState<AuthMode>(isRecoveryFromUrl ? 'reset' : 'login');

  // Pré-carregar vídeo do onboarding quando estiver no modo signup
  useEffect(() => {
    if (mode === 'signup') {
      preloadOnboardingVideo();
    }
  }, [mode]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailEntered, setEmailEntered] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isDesktop } = useDeviceType();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Listen for PASSWORD_RECOVERY event as fallback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (except during password reset)
  useEffect(() => {
    if (user && mode !== 'reset' && !isRecoveryFromUrl) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, mode, isRecoveryFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validação em tempo real para o campo nome - impedir e-mail
    if (name === 'nome' && value.includes('@')) {
      setErrors((prev) => ({ 
        ...prev, 
        nome: 'Este campo é para o seu nome, não para o e-mail. Digite seu nome completo.' 
      }));
      return;
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Detectar quando o email foi preenchido (para mostrar campo de senha)
    if (name === 'email' && mode === 'login') {
      const isValidEmail = value.includes('@') && value.includes('.');
      setEmailEntered(isValidEmail && value.length >= 5);
    }
  };

  // Reset emailEntered quando mudar de modo
  useEffect(() => {
    setEmailEntered(false);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro de autenticação',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: 'Email não confirmado',
              description: 'Por favor, confirme seu email antes de entrar.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro',
              description: 'Ocorreu um erro ao fazer login. Tente novamente.',
              variant: 'destructive',
            });
          }
          setIsLoading(false);
          return;
        }

        // Login silencioso - sem toast de boas-vindas
      } else if (mode === 'signup') {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;

        // Importar função de detecção detalhada
        const { getDetailedDeviceInfo, getDeviceSummary } = await import('@/lib/deviceDetection');
        
        // Obter informações detalhadas do dispositivo
        const deviceInfo = getDetailedDeviceInfo();
        const dispositivoResumo = getDeviceSummary();

        const { error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome: formData.nome.trim(),
              full_name: formData.nome.trim(), // Para o Dashboard do Supabase reconhecer
              dispositivo: dispositivoResumo, // Resumo: "Android 14 - Galaxy S24"
              device_info_json: JSON.stringify(deviceInfo), // Serializado como string para garantir persistência
            },
          },
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Usuário já cadastrado',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro',
              description: 'Ocorreu um erro ao criar a conta. Tente novamente.',
              variant: 'destructive',
            });
          }
          setIsLoading(false);
          return;
        }

        // Track CompleteRegistration event for Facebook Ads
        try {
          const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          if (window.fbq) {
            window.fbq('track', 'CompleteRegistration', { content_name: 'Signup', status: true }, { eventID: eventId });
          }
          supabase.functions.invoke('facebook-conversions', {
            body: {
              event_name: 'CompleteRegistration',
              event_id: eventId,
              event_time: Math.floor(Date.now() / 1000),
              event_source_url: window.location.href,
              action_source: 'website',
              user_data: { em: formData.email.trim() },
              custom_data: { content_name: 'Signup', status: true },
            },
          }).catch(() => {});
        } catch {}

        // Toast removido - redirecionamento direto
        setMode('login');
        setFormData({ nome: '', email: '', password: '', confirmPassword: '' });
      } else if (mode === 'forgot') {
        const result = forgotSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/auth?type=recovery`;

        const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
          redirectTo: redirectUrl,
        });

        if (error) {
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao enviar o email. Tente novamente.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        setMode('login');
        setFormData({ nome: '', email: '', password: '', confirmPassword: '' });
      } else if (mode === 'reset') {
        const result = resetSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });

        if (error) {
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao redefinir a senha. Tente novamente.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: 'Senha redefinida!',
          description: 'Sua senha foi alterada com sucesso.',
        });
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setFormData({ nome: '', email: '', password: '', confirmPassword: '' });
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'signup': return 'Criar conta';
      case 'forgot': return 'Recuperar senha';
      case 'reset': return 'Nova senha';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Entre com suas credenciais para acessar';
      case 'signup': return 'Preencha os dados para criar sua conta';
      case 'forgot': return 'Informe seu email para receber o link de recuperação';
      case 'reset': return 'Digite sua nova senha';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'signup': return 'Criar conta';
      case 'forgot': return 'Enviar link';
      case 'reset': return 'Redefinir senha';
    }
  };

  // Conteúdo do formulário inline para evitar perda de foco
  const formContent = (
    <Card className="border-border/30 bg-card/90 backdrop-blur-md shadow-2xl overflow-visible">
      <CardHeader className="space-y-1 pb-6 overflow-visible">
        {/* Logo e título "Direito Premium" - transição suave */}
        <div className={`grid transition-all duration-300 ease-out ${
          mode === 'login' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}>
          <div className="overflow-hidden">
            <div className="flex flex-col items-center mb-4">
              <img 
                src={logoDireitoPremium} 
                alt="Direito Premium" 
                className="w-16 h-16 mb-2 rounded-xl"
              />
              <h1 className="text-2xl font-bold text-foreground font-playfair">Direito Premium</h1>
              <p className="text-sm text-muted-foreground mt-1">Tudo do Direito em um só lugar</p>
            </div>
          </div>
        </div>

        {/* Toggle menu for login/signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex rounded-lg bg-muted/50 p-1 mb-4">
            <button
              type="button"
              onClick={() => switchMode('login')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}
        
        {/* Título e descrição - apenas para modos que não são login */}
        {mode !== 'login' && (
          <div>
            <CardTitle className="text-2xl font-bold text-center">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-center mt-2">
              {getDescription()}
            </CardDescription>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Nome - transição suave, só no signup */}
              <div className={`grid transition-all duration-300 ease-out ${
                mode === 'signup' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}>
                <div className="overflow-hidden">
                  <div className="space-y-2 pb-1">
                    <Label htmlFor="nome" className="text-sm font-medium">
                      Nome
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.nome ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                        tabIndex={mode === 'signup' ? 0 : -1}
                      />
                    </div>
                    {errors.nome && (
                      <p className="text-xs text-destructive">{errors.nome}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email - sempre visível (exceto reset) */}
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Senha - sempre visível (exceto forgot) */}
              {((mode === 'login' && emailEntered) || mode === 'signup' || mode === 'reset') && (
                <div className="space-y-2" style={{ overflow: 'visible' }}>
                  <Label htmlFor="password" className="text-sm font-medium">
                    {mode === 'reset' ? 'Nova senha' : 'Senha'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                      autoFocus={mode === 'login' && emailEntered}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Confirmar Senha - transição suave, só no signup/reset */}
              <div className={`grid transition-all duration-300 ease-out ${
                mode === 'signup' || mode === 'reset' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}>
                <div className="overflow-hidden">
                  <div className="space-y-2 pb-1">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmar senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                        tabIndex={mode === 'signup' || mode === 'reset' ? 0 : -1}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Esqueceu a senha - transição suave */}
              <div className={`grid transition-all duration-300 ease-out ${
                mode === 'login' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}>
                <div className="overflow-hidden">
                  <div className="flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-sm text-red-500 hover:text-red-400 transition-colors"
                      disabled={isLoading}
                      tabIndex={mode === 'login' ? 0 : -1}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : (
                  <>
                    {getButtonText()}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  ← Voltar para o login
                </button>
              )}
        </form>
      </CardContent>
    </Card>
  );

  // Layout Desktop - 3 colunas: imagem esquerda + formulário centralizado + close-up direita
  if (isDesktop) {
    return (
      <div className="min-h-screen">
        {/* Hero Section - Fullscreen */}
        <div className="h-screen flex relative">
          {/* Esquerda - Themis corpo inteiro (36%) */}
          <div className="w-[36%] relative overflow-hidden">
            <img 
              src={themisFull}
              alt="Themis - Deusa da Justiça"
              className="h-full w-full object-cover object-left"
              decoding="sync"
            />
            {/* Gradiente do cinza para transparente (direita para esquerda) */}
            <div className="absolute inset-0 bg-gradient-to-l from-background from-0% via-background/50 via-20% to-transparent to-40%" />
            
            {/* Conteúdo de Branding */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h1 className="text-2xl xl:text-3xl font-bold text-white mb-3 font-playfair leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Sua jornada jurídica<br />
                  <span className="text-red-500">começa aqui</span>
                </h1>
                <p className="text-sm text-white/70 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Acesse todas as ferramentas que você precisa para seus estudos jurídicos.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Centro - Formulário centralizado (28% - mais estreito) */}
          <div className="w-[28%] bg-background flex flex-col items-center justify-center px-3 py-4 overflow-y-auto">
            {/* Branding no topo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center mb-6"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={logoDireitoPremium} 
                  alt="Direito Premium" 
                  className="w-10 h-10 rounded-lg"
                />
                <span className="text-2xl font-bold text-foreground font-playfair">
                  Direito Premium
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Estudos Jurídicos
              </span>
            </motion.div>
            
            {/* Formulário */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="w-full max-w-sm"
            >
              {formContent}

              {mode === 'signup' && (
                <p className="text-center text-xs text-muted-foreground mt-6">
                  Ao continuar, você concorda com nossos{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/termos-de-uso')}
                    className="text-red-500 hover:text-red-400 transition-colors underline"
                  >
                    Termos de Uso
                  </button>
                  <br />
                  e{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/politica-de-privacidade')}
                    className="text-red-500 hover:text-red-400 transition-colors underline"
                  >
                    Política de Privacidade
                  </button>
                </p>
              )}

              {/* Scroll Indicator - Abaixo da Política de Privacidade */}
              <motion.div 
                className="flex flex-col items-center gap-2 mt-6 cursor-pointer"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <span 
                  className="text-sm font-medium tracking-wider uppercase animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, hsl(var(--muted-foreground)) 40%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 60%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Role para descobrir
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-6 h-6 text-primary" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Direita - Close-up rosto Themis (36%) */}
          <div className="w-[36%] relative overflow-hidden">
            <img 
              src={themisFaceCloseup}
              alt="Themis - Close-up"
              className="h-full w-full object-cover object-[30%_center]"
              decoding="sync"
            />
            {/* Gradiente do cinza para transparente (esquerda para direita) */}
            <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/50 via-20% to-transparent to-40%" />
          </div>
        </div>

        {/* Landing Sections - Scroll to discover features */}
        <DesktopLandingSections />
      </div>
    );
  }

  // Layout Mobile/Tablet - Com scroll para Landing Sections
  return (
    <div className="min-h-screen overflow-y-auto">
      {/* Hero Section - Primeira tela */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Image - Themis no topo */}
        <div 
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${themisFull})` }}
        />

        {/* Overlay gradiente para legibilidade - mais escuro embaixo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        
        {/* Formulário na parte inferior */}
        <div className="relative z-10 min-h-screen flex items-end justify-center p-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {/* Título "Sua jornada" acima do formulário - mobile/tablet */}
            <div className="mb-5 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-playfair leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Sua jornada jurídica<br />
                <span className="text-red-500">começa aqui</span>
              </h1>
              <p className="text-sm sm:text-base text-white/70 mt-2 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Acesse todas as ferramentas que você precisa para seus estudos jurídicos.
              </p>
            </div>

            {formContent}

            {mode === 'signup' && (
              <p className="text-center text-xs text-white/60 mt-6 leading-relaxed">
                Ao continuar, você concorda com nossos
                <br />
                <button
                  type="button"
                  onClick={() => navigate('/termos-de-uso')}
                  className="text-red-400 hover:text-red-300 transition-colors underline"
                >
                  Termos de Uso
                </button>
                {' '}e{' '}
                <button
                  type="button"
                  onClick={() => navigate('/politica-de-privacidade')}
                  className="text-red-400 hover:text-red-300 transition-colors underline"
                >
                  Política de Privacidade
                </button>
              </p>
            )}

            {/* Scroll Indicator - Mobile/Tablet (Responsivo) */}
            <motion.div 
              className="flex flex-col items-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 cursor-pointer pb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <span 
                className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.5) 60%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Role para descobrir
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Landing Sections - Scroll to discover features (igual desktop) */}
      <DesktopLandingSections />
    </div>
  );
};

export default Auth;
