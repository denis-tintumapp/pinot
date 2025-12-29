/**
 * Store de Zustand para estado de autenticación
 * Reemplaza AuthContext completamente
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthStateChange, getUsuarioActualAuth, type AuthUser } from '../../js/auth/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  anfitrionId: string | null;
  anfitrionEmail: string | null;
  anfitrionAlias: string | null;
  
  // Acciones
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setAnfitrionData: (id: string | null, email: string | null, alias: string | null) => void;
  clearAuth: () => void;
}

// Función de inicialización separada (no en el store persistido)
let authUnsubscribe: (() => void) | null = null;

export function initializeAuth() {
  // Obtener usuario actual inmediatamente
  const currentUser = getUsuarioActualAuth();
  useAuthStore.getState().setUser(currentUser);
  useAuthStore.getState().setLoading(false);

  // Suscribirse a cambios de autenticación
  authUnsubscribe = onAuthStateChange((updatedUser) => {
    useAuthStore.getState().setUser(updatedUser);
    useAuthStore.getState().setLoading(false);
  });

  return () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      loading: true,
      isAuthenticated: false,
      anfitrionId: null,
      anfitrionEmail: null,
      anfitrionAlias: null,
      
      // Acciones
      setUser: (user) => set({
        user,
        isAuthenticated: user !== null,
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setAnfitrionData: (id, email, alias) => set({
        anfitrionId: id,
        anfitrionEmail: email,
        anfitrionAlias: alias,
      }),
      
      clearAuth: () => set({
        user: null,
        isAuthenticated: false,
        anfitrionId: null,
        anfitrionEmail: null,
        anfitrionAlias: null,
      }),
    }),
    {
      name: 'auth-storage', // nombre en localStorage
      partialize: (state) => ({
        // Solo persistir datos que no cambian frecuentemente
        anfitrionId: state.anfitrionId,
        anfitrionEmail: state.anfitrionEmail,
        anfitrionAlias: state.anfitrionAlias,
      }),
    }
  )
);


