import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  skipOnboardingCheck = false 
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isComplete, planChosen, isLoading: onboardingLoading } = useOnboardingStatus();
  

  const isLoading = authLoading || (!skipOnboardingCheck && onboardingLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Redireciona para onboarding (perfil) se não estiver completo
  if (!skipOnboardingCheck && !isComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }



  return <>{children}</>;
};

export default ProtectedRoute;
