import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useTrialStatus, isTrialAllowedRoute } from '@/hooks/useTrialStatus';
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
  const { isComplete, isLoading: onboardingLoading } = useOnboardingStatus();
  const { trialExpired, loading: trialLoading } = useTrialStatus();

  const isLoading = authLoading || (!skipOnboardingCheck && onboardingLoading) || trialLoading;

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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redireciona para onboarding se não estiver completo
  if (!skipOnboardingCheck && !isComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redireciona para assinatura se o período de teste expirou
  if (trialExpired && !isTrialAllowedRoute(location.pathname)) {
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
