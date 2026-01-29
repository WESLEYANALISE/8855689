import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Lock } from 'lucide-react';

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  title = 'Login necessário',
  description = 'Para usar esta funcionalidade, você precisa estar logado.',
}: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth?mode=login');
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleLogin}
            className="w-full gap-2"
            variant="default"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </Button>
          
          <Button 
            onClick={handleSignup}
            className="w-full gap-2"
            variant="outline"
          >
            <UserPlus className="w-4 h-4" />
            Cadastre-se
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          É rápido e gratuito!
        </p>
      </DialogContent>
    </Dialog>
  );
}
