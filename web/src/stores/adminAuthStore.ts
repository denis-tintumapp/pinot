/**
 * Store de Zustand para autenticación de admin
 * Con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  authToken: string | null;
  
  // Acciones
  setAuthToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      authToken: null,
      
      setAuthToken: (token) => set({ authToken: token }),
      clearAuth: () => set({ authToken: null }),
    }),
    {
      name: 'admin_auth_token', // Mantener el mismo nombre para compatibilidad
    }
  )
);

