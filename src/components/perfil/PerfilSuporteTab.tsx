import { Mail, MessageCircle, ExternalLink, Bug, HelpCircle, CreditCard, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'bug',
    label: 'Reportar um bug',
    icon: <Bug className="h-4 w-4" />,
    subject: '[Bug] Problema encontrado no app',
    body: `Olá equipe Direito Premium,

Encontrei um problema no aplicativo e gostaria de reportar:

**Descrição do bug:**
[Descreva o que aconteceu]

**O que você esperava que acontecesse:**
[Descreva o comportamento esperado]

**Passos para reproduzir:**
1. 
2. 
3. 

**Dispositivo/Navegador:**
[Ex: iPhone 14, Safari / Chrome no Windows]

Obrigado pela atenção!`,
  },
  {
    id: 'duvida',
    label: 'Tirar uma dúvida',
    icon: <HelpCircle className="h-4 w-4" />,
    subject: '[Dúvida] Preciso de ajuda',
    body: `Olá equipe Direito Premium,

Tenho uma dúvida sobre o aplicativo:

**Minha dúvida:**
[Descreva sua dúvida aqui]

Agradeço desde já pela ajuda!`,
  },
  {
    id: 'financeiro',
    label: 'Questão financeira',
    icon: <CreditCard className="h-4 w-4" />,
    subject: '[Financeiro] Questão sobre pagamento/assinatura',
    body: `Olá equipe Direito Premium,

Tenho uma questão relacionada a pagamento ou assinatura:

**Tipo de questão:**
[ ] Problema com pagamento
[ ] Solicitação de reembolso
[ ] Dúvida sobre cobrança
[ ] Alteração de plano
[ ] Outro

**Detalhes:**
[Descreva sua situação aqui]

**Dados para identificação:**
- Email da conta: [seu email]
- Data aproximada da transação (se aplicável): 

Aguardo retorno!`,
  },
];

export function PerfilSuporteTab() {
  const { user } = useAuth();
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  const handleEmailTemplate = (template: EmailTemplate) => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(`${template.body}

---
Email da conta: ${user?.email || 'Não identificado'}`);
    window.open(`mailto:suporte@direitopremium.com.br?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppSupport = () => {
    if (!isPremium) {
      toast.error('Suporte WhatsApp é exclusivo para assinantes Premium', {
        description: 'Assine agora e tenha acesso ao atendimento prioritário!',
        action: {
          label: 'Ver planos',
          onClick: () => navigate('/assinatura')
        },
        duration: 5000
      });
      return;
    }
    const message = encodeURIComponent('Olá! Sou assinante Premium do Direito Premium e preciso de suporte.');
    window.open(`https://wa.me/5511991897603?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Suporte Header */}
      <div className="text-center py-4">
        <h3 className="font-bold text-lg mb-2">Precisa de ajuda?</h3>
        <p className="text-sm text-muted-foreground">
          Estamos aqui para te ajudar! Escolha a melhor forma de contato.
        </p>
      </div>

      {/* Email Templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Enviar e-mail</span>
        </div>
        
        <div className="grid gap-2">
          {EMAIL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleEmailTemplate(template)}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{template.label}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp Option - Premium Only */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
          {!isPremium && !loading && (
            <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>

        <div className={`p-5 rounded-2xl border ${
          isPremium 
            ? 'bg-card hover:bg-muted/50' 
            : 'bg-muted/30 opacity-60'
        } transition-colors relative`}>
          {!isPremium && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Exclusivo para assinantes</span>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              isPremium ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
            }`}>
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold">Atendimento prioritário</h4>
                <p className="text-sm text-muted-foreground">
                  Respostas rápidas em horário comercial
                </p>
              </div>
              <Button 
                onClick={handleWhatsAppSupport}
                disabled={!isPremium}
                variant="outline"
                className="w-full sm:w-auto border-green-500/30 text-green-600 hover:bg-green-500/10 disabled:opacity-50"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Iniciar conversa
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
      </div>
    </div>
  );
}
