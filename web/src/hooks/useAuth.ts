/**
 * Hook de autenticación
 * Reemplaza useAuth de AuthContext, ahora usa Zustand
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook para acceder al estado de autenticación
 * Compatible con la API anterior de AuthContext
 */
export const useAuth = () => {
  const { user, loading, isAuthenticated } = useAuthStore();

  // La inicialización se hace en App.tsx, no aquí
  // Este hook solo expone el estado

  return {
    user,
    loading,
    isAuthenticated,
  };
};

