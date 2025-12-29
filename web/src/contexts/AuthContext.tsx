/**
 * Contexto de autenticación
 * Proporciona el estado de autenticación a toda la aplicación
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange, getUsuarioActualAuth, type AuthUser } from '../../js/auth/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual inmediatamente
    const currentUser = getUsuarioActualAuth();
    setUser(currentUser);
    setLoading(false);

    // Suscribirse a cambios de autenticación
    const unsubscribe = onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};











