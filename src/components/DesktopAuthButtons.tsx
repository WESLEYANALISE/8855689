import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, UserPlus, User, Settings, LogOut, Crown, Star, HelpCircle } from 'lucide-react';

export function DesktopAuthButtons() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  // Se não estiver logado, mostra botões de Login e Cadastre-se
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth?mode=login')}
          className="text-white/90 hover:text-white hover:bg-white/10 font-medium"
        >
          <LogIn className="w-4 h-4 mr-1.5" />
          Login
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/auth?mode=signup')}
          className="bg-white text-[#8B0000] hover:bg-white/90 font-medium rounded-full px-4"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Cadastre-se
        </Button>
      </div>
    );
  }

  // Se estiver logado, mostra avatar com dropdown
  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition-colors">
          <Avatar className="w-8 h-8 border-2 border-white/30">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-white/90 text-sm font-medium max-w-[120px] truncate">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <User className="w-4 h-4 mr-2" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/perfil?tab=favoritos')}>
          <Star className="w-4 h-4 mr-2" />
          Meus Favoritos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/assinatura')}>
          <Crown className="w-4 h-4 mr-2" />
          Assinatura
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/assinatura')}>
          <Crown className="w-4 h-4 mr-2" />
          Premium
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/ajuda')}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Ajuda
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
