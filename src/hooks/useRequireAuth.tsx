import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseRequireAuthResult {
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  requireAuth: (callback: () => void) => void;
  isAuthenticated: boolean;
}

export function useRequireAuth(): UseRequireAuthResult {
  const { user } = useAuth();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const isAuthenticated = !!user;

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      callback();
    } else {
      setIsAuthDialogOpen(true);
    }
  }, [user]);

  return {
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    requireAuth,
    isAuthenticated,
  };
}
